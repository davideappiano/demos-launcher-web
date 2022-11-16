// src\app\services\websocket.service.ts
import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { AnonymousSubject } from 'rxjs/internal/Subject';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';

const CHAT_URL = 'ws://localhost:5000';

export interface Message {
  source: string;
  content: string;
}

@Injectable()
export class WebsocketService {
  public messages: Subject<Message>;
  private subject: AnonymousSubject<MessageEvent> | undefined;

  constructor() {
    this.messages = this.connect(CHAT_URL).pipe(
      map(
        (response: MessageEvent): Message => {
          console.log(response.data);
          const data = JSON.parse(response.data);
          return data;
        }
      )
    ) as Subject<Message>;
  }

  public connect(url: string | URL): AnonymousSubject<MessageEvent> {
    if (!this.subject) {
      this.subject = this.create(url);
      console.log('Successfully connected: ' + url);
    }
    return this.subject;
  }

  private create(url: string | URL): AnonymousSubject<MessageEvent> {
    const ws = new WebSocket(url);

    const observable = new Observable((obs: Observer<MessageEvent>) => {
      ws.onmessage = obs.next.bind(obs);
      ws.onerror = obs.error.bind(obs);
      ws.onclose = obs.complete.bind(obs);
      return ws.close.bind(ws);
    });

    const observer : Observer<MessageEvent<any>> = {
      error: () => {},
      complete: () => {},
      next: (data: any) => {
        console.log('Message sent to websocket: ', data);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(data));
        }
      }
    };
    return new AnonymousSubject<MessageEvent>(observer, observable);
  }
}
