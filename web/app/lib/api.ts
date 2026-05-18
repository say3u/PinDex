import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
});

export async function getSummary(bowlerId: string) {
  return api.get(`/stats/${bowlerId}/summary`).then((r) => r.data);
}

export async function getBowlerGames(bowlerId: string) {
  return api.get(`/games/bowler/${bowlerId}`).then((r) => r.data);
}

export async function getGameFrames(gameId: string) {
  return api.get(`/frames/game/${gameId}`).then((r) => r.data);
}
