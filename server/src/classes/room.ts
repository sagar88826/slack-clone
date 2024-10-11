export default class Room {
  roomId: number;
  roomTitle: string;
  namespaceId: number;
  privateRoom: boolean;
  history: string[] = [];

  constructor(
    roomId: number,
    roomTitle: string,
    namespaceId: number,
    privateRoom: boolean = false
  ) {
    this.roomId = roomId;
    this.roomTitle = roomTitle;
    this.namespaceId = namespaceId;
    this.privateRoom = privateRoom;
  }

  addMessage(message: string) {
    this.history.push(message);
  }

  clearHistory() {
    this.history = [];
  }
}
