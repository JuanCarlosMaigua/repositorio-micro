export class PollModel {

  constructor () {
    this.clear();
  }
  pollId?: number;

  clear(): void {
    this.pollId = 0;
  }
}
