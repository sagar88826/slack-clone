import { Type } from "class-transformer";
import Room from "./room.js";
import "reflect-metadata";

export default class Namespace {
  id: number;
  name: string;
  image: string;
  endpoint: string;
  @Type(() => Room)
  room: Room[];
  constructor(
    id: number,
    name: string,
    image: string,
    endpoint: string,
    room: Room[]
  ) {
    this.id = id;
    this.name = name;
    this.image = image;
    this.endpoint = endpoint;
    this.room = room;
  }

  addRoom(roomObj: Room) {
    this.room.push(roomObj);
  }
}
