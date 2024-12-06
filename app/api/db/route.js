import { promises as fs } from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "db.json");

export async function GET(req) {
  try {
    let data;
    try {
      data = await fs.readFile(filePath, "utf8");
      data = JSON.parse(data); // Parse the file content
    } catch (error) {
      const initialData = {
        advisors: [],
        students: [],
        admins: [],
        courses: [],
        classes: [],
        results: [],
        schemeOfStudy: [],
      };
      await fs.writeFile(
        filePath,
        JSON.stringify(initialData, null, 2),
        "utf8"
      );
      data = initialData; // Return initialized data
    }

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({ message: "Error reading db.json", error }),
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    // console.log("Received Body:", body);
    let existingData;
    try {
      const fileContent = await fs.readFile(filePath, "utf8");
      existingData = JSON.parse(fileContent);
    } catch (error) {
      existingData = {
        advisors: [],
        students: [],
        admins: [],
        courses: [],
        classes: [],
        results: [],
        schemeOfStudy: [],
      };
    }

    const updatedData = { ...existingData, ...body };

    await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2), "utf8");

    return new Response(JSON.stringify(updatedData), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({ message: "Error writing to db.json", error }),
      { status: 500 }
    );
  }
}
