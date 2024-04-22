import { Request, Response } from "express";
import { hashPassword, compareHashedPassword } from "../utils/password_helper";
import { ulid } from "ulid";
import { db } from "../database/database";
import { devs } from "../schema";
import { eq, like, or } from "drizzle-orm";
import {
  Dev,
  DevCredential,
  Devs,
  DevUsername,
  Me,
  NewDev,
} from "../types/types";
import jwt from "jsonwebtoken";

export const getAllDevs = async (request: Request, response: Response) => {
  try {
    const data: Devs[] = await db.query.devs.findMany({
      columns: {
        id: true,
        firstname: true,
        middlename: true,
        lastname: true,
      },
    });
    return response.status(200).send({
      message: "Fetched Successfully",
      data,
      ok: true,
    });
  } catch (error) {
    console.log("Error Fetch All Data:", error);
    return response.status(400).send({
      message: "Failed to fetched data",
      ok: false,
    });
  }
};

export const getDevByID = async (request: Request, response: Response) => {
  const { id } = request.params;
  try {
    const data: Dev | undefined = await db.query.devs.findFirst({
      columns: {
        id: true,
        username: true,
        firstname: true,
        middlename: true,
        lastname: true,
        bio: true,
        stacks: true,
        links: true,
      },
      where: eq(devs.id, id),
    });
    return response.status(200).send({
      data,
    });
  } catch (error) {
    return response.status(400).send({
      error: error,
    });
  }
};

export const searchDev = async (request: Request, response: Response) => {
  try {
    const { search }: string = await request.body;
    const searchResult = await db.query.devs.findMany({
      columns: { id: true, firstname: true, middlename: true, lastname: true },
      where: or(
        like(devs.username, `%${search}%`),
        like(devs.firstname, `%${search}%`),
        like(devs.middlename, `%${search}%`),
        like(devs.lastname, `%${search}%`)
      ),
    });
    return response.status(200).send({
      data: searchResult,
    });
  } catch (error) {
    return response.status(400).send({
      error: error,
    });
  }
};

export const createDev = async (request: Request, response: Response) => {
  const id = ulid();
  const {
    username,
    firstname,
    password: UserPassword,
    confirm_password,
  }: NewDev = request.body;
  // Note to myself: I think I need to improve this, Instead of doing the validatiom here, why not in the frontend instead.
  if (!username && !firstname && !UserPassword && !confirm_password)
    return response.status(400).send({ message: "Fields are required" });
  if (!username)
    return response.status(400).send({ message: "Username is required" });
  const isUsernameExist: DevUsername | undefined =
    await db.query.devs.findFirst({
      columns: { username: true },
      where: eq(devs.username, username),
    });
  if (isUsernameExist)
    return response
      .status(409)
      .send({ message: "Username is already taken", ok: false });
  if (!firstname)
    return response.status(400).send({ message: "Firstname is required" });
  if (!UserPassword)
    return response.status(400).send({ message: "Password is required" });
  if (UserPassword !== confirm_password)
    return response.status(400).send({ message: "Password not match" });
  const password = hashPassword(UserPassword);

  try {
    await db.insert(devs).values({ id, ...request.body, password });
    return response.status(200).send({
      message: "Signed up Successfully",
      ok: true,
    });
  } catch (error) {
    console.log("Error Signup:", error);
    return response.status(400).send({
      message: "Failed to signup",
      ok: false,
    });
  }
};

export const isVerified = async (
  request: Request,
  response: Response
): Promise<Response> => {
  const { token }: { token: string } = await request.body;
  if (!token)
    return response.status(401).send({ message: "Authorized", ok: false });
  const isVerified: any = jwt.verify(
    token,
    process.env.ACCESS_SECRET!,
    (err, decoded) => {
      if (err) return false;
      return true;
    }
  );
  if (!isVerified)
    return response.status(401).send({ message: "Unauthorized", ok: false });
  return response.status(200).send({ message: "Authorized", ok: true });
};

export const loginDev = async (request: Request, response: Response) => {
  const { username, password }: DevCredential = await request.body;
  const result: DevCredential | undefined = await db.query.devs.findFirst({
    columns: { id: true, username: true, password: true },
    where: eq(devs.username, username!),
  });
  if (!result)
    return response.status(404).send({ message: "Wrong username or password" });
  const isMatched = compareHashedPassword(password!, result?.password!);
  if (!isMatched)
    return response.status(404).send({ message: "Wrong username or password" });
  const accessToken = jwt.sign(
    {
      id: result?.id,
      username: result?.username,
    },
    process.env.ACCESS_SECRET ?? "test",
    { expiresIn: "15m" }
  );
  const refreshToken = jwt.sign(
    {
      // note to myself: This refresh token should be set in here to be a http only in cookie
      id: result?.id,
    },
    process.env.ACCESS_SECRET ?? "test",
    { expiresIn: "1d" }
  );
  return response.status(200).send({
    message: "Logged in successfully",
    accessToken,
    data: { id: result?.id },
  });
};

export const updateDevByID = async (request: Request, response: Response) => {
  /**
   * Note to myself:
   * 1) Improve the change password, make a other page for it maybe.
   * 2) Leave the links like that or make a seperate table for links and use relations, then use transaction to insert both update and links
   * 3) if id is not present return 401 status that says unauthorized or forbidden 403 or make a middleware here before to update, validate if user is authenticated etc
   * */
  const {
    id,
    username,
    firstname,
    middlename,
    lastname,
    bio,
    stacks,
    links: UserLinks,
    password,
  }: Me = request.body;
  const links = JSON.stringify(UserLinks);
  if (
    !username &&
    !firstname &&
    !middlename &&
    !lastname &&
    !bio &&
    !stacks &&
    !links &&
    !password
  )
    return response.status(400).send({
      message: "Fields are required",
    });
  try {
    await db
      .update(devs)
      .set({ ...request.body, links })
      .where(eq(devs.id, id));
    return response.status(200).send({
      message: "Updated Successfully",
    });
  } catch (error) {
    console.log("Error Update:", error);
    return response.status(400).send({
      error: error,
    });
  }
};

export const deleteDevByID = async (request: Request, response: Response) => {
  const { id } = request.params;
  try {
    await db.delete(devs).where(eq(devs.id, id));
    return response.status(200).send({ message: "Deleted successfully" });
  } catch (error) {
    console.log("Error Delete:", error);
    return response.status(400).send({ message: "Failed to delete" });
  }
};
