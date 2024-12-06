"use server";

import { redirect } from "next/navigation";
import fs from "fs/promises";
import path from "path";
// session.js
import { SignJWT, jwtVerify } from "jose";
// dal.js
import { cookies } from "next/headers";
import { cache } from "react";

const secretKey = process.env.SESSION_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

export async function encrypt(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function decrypt(session) {
  if (!session) {
    console.log("No session provided");
    return null;
  }
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error) {
    console.log("Decryption Failed:", error.message);
    return null;
  }
}

// creating and deleting session
export async function createSession(user) {
  const createdAt = new Date(Date.now());
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await encrypt({ ...user, createdAt, expiresAt });
  const cookie = await cookies();

  cookie.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    createdAt,
    createdAt,
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function deleteSession() {
  const cookie = await cookies();
  cookie.delete("session");
}

// const users = [
//   {
//     id: "admin",
//     name: "admin",
//     email: "admin@gmail.com",
//     password: "admin",
//     role: "admin",
//   },
//   {
//     id: "advisor",
//     name: "advisor",
//     email: "advisor@gmail.com",
//     password: "advisor",
//     role: "advisor",
//   },
//   {
//     id: "student",
//     name: "student",
//     email: "student@gmail.com",
//     password: "student",
//     role: "student",
//   },
// ];
export const loginFn = async (prevState, formData) => {
  const userData = {
    email: formData.get("email").trim(),
    password: formData.get("password").trim(),
  };

  const dbPath = path.join(process.cwd(), "db.json");

  const data = JSON.parse(await fs.readFile(dbPath, "utf-8"));

  const users = [
    ...data.students.map((student) => ({ ...student, role: "student" })),
    ...data.advisors.map((advisor) => ({ ...advisor, role: "advisor" })),
    ...data.admins.map((admin) => ({ ...admin, role: "admin" })),
  ];

  const user = users.find((user) => user.email === userData.email);

  if (!user || user.password !== userData.password) {
    return { errors: { email: ["Invalid email or password"] } };
  }

  await createSession(user);
  redirect("/");
};

export async function logoutSession() {
  await deleteSession();
  redirect("/auth");
}

export const verifySession = cache(async () => {
  const cookie = (await cookies()).get("session")?.value;
  const session = await decrypt(cookie);

  // console.log("Verifying Session in dal");
  return session;
});
