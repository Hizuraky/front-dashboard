import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { encrypt, decrypt } from "@/lib/security";
import { v4 as uuidv4 } from "uuid";

type PasswordEntry = {
  id: string;
  site: string;
  username: string;
  password: string; // Encrypted in file, Decrypted in response
  updatedAt: string;
};

// Helper to get file path safely
const getFilePath = () => {
  return path.join(process.cwd(), "passwords.json");
};

// Helper to seed data if missing
function ensureDataExists() {
  const filePath = getFilePath();
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]));
  }
}

export async function GET() {
  try {
    ensureDataExists();
    const fileContent = fs.readFileSync(getFilePath(), "utf-8");
    const data: PasswordEntry[] = JSON.parse(fileContent);

    // Decrypt passwords before sending to client
    const decryptedData = data.map((entry) => {
      try {
        return {
          ...entry,
          password: decrypt(entry.password),
        };
      } catch (e) {
        console.error(`Failed to decrypt password for ${entry.site}`, e);
        return { ...entry, password: "" }; // Return empty or keep encrypted if failure
      }
    });

    return NextResponse.json(decryptedData);
  } catch (error) {
    console.error("Error reading passwords:", error);
    return NextResponse.json(
      { error: "Failed to load passwords" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { site, username, password, id } = body;

    if (!site || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    ensureDataExists();
    const filePath = getFilePath();
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const data: PasswordEntry[] = JSON.parse(fileContent);

    const encryptedPassword = encrypt(password);
    const now = new Date().toISOString();

    let updatedData;
    if (id) {
      // Update existing
      updatedData = data.map((item) =>
        item.id === id
          ? {
              ...item,
              site,
              username: username || "",
              password: encryptedPassword,
              updatedAt: now,
            }
          : item
      );
    } else {
      // Create new
      const newEntry: PasswordEntry = {
        id: uuidv4(),
        site,
        username: username || "",
        password: encryptedPassword,
        updatedAt: now,
      };
      updatedData = [newEntry, ...data];
    }

    fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));

    // Return the single item (decrypted) or success
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving password:", error);
    return NextResponse.json(
      { error: "Failed to save password" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    ensureDataExists();
    const filePath = getFilePath();
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const data: PasswordEntry[] = JSON.parse(fileContent);

    const updatedData = data.filter((item) => item.id !== id);

    fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
