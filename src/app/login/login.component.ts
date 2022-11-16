import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import { WebsocketService } from '../websockets/websockets.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  providers: [WebsocketService]
})
export class LoginComponent implements OnInit {

  title = 'socketrv';
  content = '';
  received = [];
  sent = [];

  constructor(websocketService: WebsocketService) {
    // websocketService.messages.subscribe(msg => {
    //   this.received.push(msg);
    //   console.log('Response from websocket: ' + msg);
    // });
  }

  ngOnInit(): void {

  }

  async login() {
    // await this.auth.signInWithRedirect(new firebase.auth.GoogleAuthProvider());
  }

  sendMsg() {
    // const message = {
    //   source: '',
    //   content: ''
    // };
    // message.source = 'localhost';
    // message.content = this.content;

    // this.sent.push(message);
    // this.websocketService.messages.next(message);
  }
}

