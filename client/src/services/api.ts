import axios from "axios";
import {
  AddORUpdateDevDataTypes,
  LoginDevTypes,
  SignupDevTypes,
} from "../types/types";
import { SearchType } from "../components/Search";
const BASE_URL = "http://localhost:5000/api";
export const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

export const getAllDevsAPI = async () => {
  const { data } = await axiosInstance.get("/devs");
  return data;
};

export const getDevsByIDAPI = async (args: { queryKey: string[] }) => {
  const { queryKey } = args;
  const { data } = await axiosInstance.get(`/devs/${queryKey[1]}`);
  return data;
};

export const getDevsBySearch = async (data: SearchType) =>
  await axiosInstance.post("/devs/search", data);

export const createDevAPI = async (data: SignupDevTypes) =>
  await axiosInstance.post("/devs/signup", data);

export const LoginDevAPI = async (data: LoginDevTypes) =>
  await axiosInstance.post("/devs/signin", data);

export const updateDevAPI = async (data: AddORUpdateDevDataTypes) =>
  await axiosInstance.put("/devs/update", data);
