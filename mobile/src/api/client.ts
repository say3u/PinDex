import axios from "axios";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

export const api = axios.create({ baseURL: API_URL });

export const createGame = (bowlerId: string, lane?: number, league?: string, oilPattern = "house", ballUsed?: string) =>
  api.post("/games/", { bowler_id: bowlerId, lane, league, oil_pattern: oilPattern, ball_used: ballUsed }).then((r) => r.data);

export const logFrame = (payload: {
  game_id: string;
  frame_number: number;
  ball1_pins: number;
  ball2_pins?: number;
  ball3_pins?: number;
  ball1_speed?: number;
  ball1_arrow?: number;
  ball1_hook?: number;
  hand_style?: string;
  ball2_speed?: number;
  ball2_arrow?: number;
}) => api.post("/frames/", payload).then((r) => r.data);

export const getSummary = (bowlerId: string) =>
  api.get(`/stats/${bowlerId}/summary`).then((r) => r.data);

export const lookupBall = (name: string) =>
  api.post("/balls/lookup", { name }).then((r) => r.data);

export const getCoaching = (payload: {
  frames_played: number;
  strikes: number;
  spares: number;
  opens: number;
  recent_leaves: string[];
  spare_conversion_rate: number;
  avg_speed?: number;
  avg_hook?: number;
  oil_pattern: string;
  ball_name?: string;
  hand_style?: string;
  last_frames: string[];
}) => api.post("/coach/", payload).then((r) => r.data);

export const deleteFrame = (gameId: string, frameNumber: number) =>
  api.delete(`/frames/${gameId}/${frameNumber}`).then((r) => r.data);

export const recommendBall = (payload: {
  balls: any[];
  strike_rate: number;
  recent_leaves: string[];
  oil_pattern: string;
  frames_played: number;
  avg_speed?: number;
  avg_hook?: number;
}) => api.post("/balls/recommend", payload).then((r) => r.data);
