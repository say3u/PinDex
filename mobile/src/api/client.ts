import axios from "axios";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

export const api = axios.create({ baseURL: API_URL });

export const createGame = (bowlerId: string, lane?: number, league?: string) =>
  api.post("/games/", { bowler_id: bowlerId, lane, league }).then((r) => r.data);

export const logFrame = (payload: {
  game_id: string;
  frame_number: number;
  ball1_pins: number;
  ball2_pins?: number;
  ball3_pins?: number;
}) => api.post("/frames/", payload).then((r) => r.data);

export const getSummary = (bowlerId: string) =>
  api.get(`/stats/${bowlerId}/summary`).then((r) => r.data);
