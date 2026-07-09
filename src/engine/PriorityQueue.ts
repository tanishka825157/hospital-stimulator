export type Comparator<T> = (a: T, b: T) => number;

export class PriorityQueue<T> {
  private heap: T[] = [];

  constructor(private readonly compare: Comparator<T>) {}

  get size() {
    return this.heap.length;
  }

  enqueue(item: T) {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  dequeue(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const last = this.heap.pop();
    if (last && this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  peek(): T | undefined {
    return this.heap[0];
  }

  clear() {
    this.heap = [];
  }

  remove(predicate: (item: T) => boolean): T | undefined {
    const index = this.heap.findIndex(predicate);
    if (index === -1) return undefined;
    const [removed] = this.heap.splice(index, 1);
    this.rebuild(this.heap);
    return removed;
  }

  toArray(): T[] {
    return [...this.heap].sort(this.compare);
  }

  rebuild(items: T[]) {
    this.heap = [];
    items.forEach((item) => this.enqueue(item));
  }

  private bubbleUp(index: number) {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.compare(this.heap[index], this.heap[parent]) >= 0) break;
      [this.heap[index], this.heap[parent]] = [this.heap[parent], this.heap[index]];
      index = parent;
    }
  }

  private sinkDown(index: number) {
    while (true) {
      const left = index * 2 + 1;
      const right = index * 2 + 2;
      let best = index;
      if (left < this.heap.length && this.compare(this.heap[left], this.heap[best]) < 0) best = left;
      if (right < this.heap.length && this.compare(this.heap[right], this.heap[best]) < 0) best = right;
      if (best === index) break;
      [this.heap[index], this.heap[best]] = [this.heap[best], this.heap[index]];
      index = best;
    }
  }
}
