import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import xml2js from 'xml2js'; 
import { Network } from 'ionic-native';

declare const chrome;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  
  posts : any;
  Myhttp : Http;
  port : number;
  socket : any;
  connected : boolean;
  toTag : string;
  myNet : Network;

  constructor(public navCtrl: NavController, public http: Http) {
    console.log("Constructor called");    
    this.Myhttp = http;
    this.socket = -1;
    this.connected = false;
    this.toTag = "";
  }


  load(http){
    this.http.get('https://service1.auris.com/vclec/mobileapps/623789211A/Services.asp?transaction_type=565&product_id=10053&ani_number=3055886662&response_type=03').
    subscribe(data => {
      console.log(data["_body"]);

      let parser = new xml2js.Parser(
      {
        trim: true,
        explicitArray: true
      });
      parser.parseString(data["_body"],function(err,result){
        console.log(result.Auris.PrepaidAccount[0].response_msg);
        for (let k in result.Auris.Record){
          console.log(result.Auris.Record[k].AccountPlanInfo[0].PlanName);
        }
                
      });
    });
  }   
  
  ab2str(buf){
    return String.fromCharCode.apply(null, new Uint8Array(buf));
  }

  UDPSend = (remoteIP : string, remotePort: number) => {
    chrome.sockets.udp.create((createInfo) => {
      console.log('Socket Id created ' + createInfo.socketId);
      let lPort : number = 45678;//-1;
      let lIP : string = "10.100.61.17"; //"";

      this.socket = createInfo.socketId;
      console.log('After assigning socketid: ' + this.socket + ":" + createInfo.socketId);
      chrome.sockets.udp.bind(createInfo.socketId, "0.0.0.0", 0, (result) => {
        console.log('Bind result: ' + result);
        console.log('new value: ' + createInfo.socketId);    
        chrome.sockets.udp.getInfo(createInfo.socketId, (socketInfo) => {
          lIP = socketInfo.localAddress;
          lPort = socketInfo.localPort;
          console.log('Socket_IP:Port ' + JSON.stringify(socketInfo) +  ":" + lIP +  ":" + lPort);

          chrome.sockets.udp.onReceive.addListener(this.UDPReceiveListener);

          let INVITE : string = "INVITE sip:30307864723569@72.13.65.18 SIP/2.0\r\n" +
            "Via: SIP/2.0/UDP " + lIP + ":" + lPort +";branch=z9hG4bK399ac27d\r\n" +
            "Max-Forwards: 70\r\n" +
            "From: <sip:3055886662@" +  lIP + ":" + lPort +">;tag=as0dc3ed07\r\n" +
            "To: <sip:30307864723569@72.13.65.18>\r\n" +
            "Contact: <sip:3055886662@" +  lIP + ":" + lPort +">\r\n" +
            "Call-ID: 290997367d34cda94f9da5952f20ae12@" +  lIP + ":" + lPort +"\r\n" +
            "CSeq: 102 INVITE\r\n" +
            "User-Agent: IonicSIP UA\r\n" +
            "Date: Wed, 01 Feb 2017 14:09:52 GMT\r\n" +
            "Allow: INVITE, ACK, CANCEL, OPTIONS, BYE, REFER, SUBSCRIBE, NOTIFY, INFO, PUBLISH, MESSAGE\r\n" +
            "Supported: replaces, timer\r\n" +
            "Content-Type: application/sdp\r\n" +
            "Content-Length: 309\r\n\r\n" +
            "v=0\r\n" +
            "o=root 1313952988 1313952988 IN IP4 " + lIP + "\r\n" +
            "s=Asterisk PBX 11.11.0\r\n" +
            "c=IN IP4 " + lIP + "\r\n" +
            "t=0 0\r\n" +
            "m=audio 15272 RTP/AVP 0 18 8 101\r\n" +
            "a=rtpmap:0 PCMU/8000\r\n" +
            "a=rtpmap:18 G729/8000\r\n" +
            "a=fmtp:18 annexb=no\r\n" +
            "a=rtpmap:8 PCMA/8000\r\n" +
            "a=rtpmap:101 telephone-event/8000\r\n" +
            "a=fmtp:101 0-16\r\n" +
            "a=ptime:20\r\n" +
            "a=sendrecv\r\n\r\n"; 

          console.log("Msg to be sent: " + INVITE);
          var buf = new ArrayBuffer(INVITE.length);
          var bufView = new Uint8Array(buf);
          for (var i=0, strLen=INVITE.length; i < strLen; i++) {
              bufView[i] = INVITE.charCodeAt(i);
          }
          chrome.sockets.udp.send(createInfo.socketId, buf, remoteIP, remotePort, (sendInfo) => {
              console.log('Inside Send: ' + JSON.stringify(sendInfo));    
            if (sendInfo.resultCode < 0) {
              console.log('Send: fail: ' + sendInfo.resultCode);
              chrome.sockets.udp.close(createInfo.socketId);
            } else {
              console.log('Send: success ' + sendInfo.resultCode);
            }
          });//socket send

          });

      });//socket bind
    });//socket create

  }//UDPSend start

  SendACK = (ackType : number, msg : string) => {
    //local vars for now
    let lPort : number = 45678;//-1;
    let lIP : string = "10.100.61.17"; //"";
    let lviaBranch : string = "";
    let RURI : string = "";
    let callID : string = "";
    let toTag : string =  "";

    if (ackType < 0){
      console.log('Inside SendACK. Preparing ACK for a Rejected Request.');
      lviaBranch = "z9hG4bK399ac27d";
      RURI = "430307864723569@72.13.65.66";
    } else {
      console.log('Inside SendACK. Preparing ACK for an Accepted Request.');
      lviaBranch = "z9hG4bK250f721e"
      let index1 : number = msg.indexOf("Contact: <sip:") + 14;
      let index2 : number = msg.indexOf(">\r\n",index1);
      RURI = msg.substr(index1, index2 - index1);      
    }

    let index1 : number = msg.indexOf("Call-ID: ") + 9;
    let index2 : number = msg.indexOf("\r\n",index1);
    callID = msg.substr(index1, index2 - index1);
    
    index1 = index2 = 0;
    index1 = msg.indexOf("To:");
    index2 = msg.indexOf(";tag=",index1) + 5;
    let index3 : number = msg.indexOf("\r\n",index2);
    toTag = msg.substr(index2, index3 - index2);
    this.toTag = toTag;
    
    let ACK = "ACK sip:" + RURI + " SIP/2.0\r\n" +
      "Via: SIP/2.0/UDP " + lIP + ":" + lPort +";branch=" + lviaBranch +"\r\n" +
      "Route: <sip:72.13.65.18;lr>\r\n" +
      "Max-Forwards: 70\r\n" +
      "From: <sip:3055886662@" + lIP + ":" + lPort +">;tag=as0dc3ed07\r\n" +
      "To: <sip:30307864723569@72.13.65.18>;tag=" + toTag +"\r\n" +
      "Contact: <sip:3055886662@" + lIP + ":" + lPort +">\r\n" +
      "Call-ID: " + callID + "\r\n" +
      "CSeq: 102 ACK\r\n" +
      "User-Agent: IonicSIP UA\r\n" +
      "Content-Length: 0\r\n\r\n";

      console.log("Msg to be sent: " + ACK);
      var buf = new ArrayBuffer(ACK.length);
      var bufView = new Uint8Array(buf);
      for (var i=0, strLen=ACK.length; i < strLen; i++) {
          bufView[i] = ACK.charCodeAt(i);
      }
      chrome.sockets.udp.send(this.socket, buf, '72.13.65.18', 5060, (sendInfo) => {
          console.log('Sending ACK: ' + JSON.stringify(sendInfo));   
          console.log('Sending ACK: result ' + sendInfo.resultCode);
          this.connected = true;
      });
    
  }

  SendResponse(requestMethod : string, msg : string){

    let reply : string = "SIP/2.0 200 OK\r\n";
    if (requestMethod == "BYE"){
      let index1 : number = msg.indexOf("\r\n") + 2;
      let index2 : number = msg.indexOf("User-Agent",index1);
      let part1 : string = msg.substr(index1,index2 - index1);
      reply += part1;
      reply += "Supported: replaces, timer\r\n" +
                "Content-Length: 0\r\n\r\n";
    
      console.log("Msg to be sent: " + reply);
      var buf = new ArrayBuffer(reply.length);
      var bufView = new Uint8Array(buf);
      for (var i=0, strLen=reply.length; i < strLen; i++) {
          bufView[i] = reply.charCodeAt(i);
      }
      chrome.sockets.udp.send(this.socket, buf, '72.13.65.18', 5060, (sendInfo) => {
          console.log('Sending Reply: ' + JSON.stringify(sendInfo));   
          console.log('Sending Reply: result ' + sendInfo.resultCode);
      });
    }
  }

  SendBYE(){
    //local vars for now
    let lPort : number = 45678;//-1;
    let lIP : string = "10.100.61.17"; //"";
  
    console.log('Inside SendBYE. Preparing ACK for an Accepted Request.');
   
    let BYE = "BYE sip:430307864723569@72.13.65.66:5060 SIP/2.0\r\n" +
      "Via: SIP/2.0/UDP " + lIP + ":" + lPort +";branch=z9hG4bK1234abcd.1\r\n" +
      "Route: <sip:72.13.65.18;lr>\r\n" +
      "Max-Forwards: 70\r\n" +
      "From: <sip:7864723569@" + lIP + ":" + lPort +">;tag=as0dc3ed07\r\n" +
      "To: <sip:30303055886662@72.13.65.18>;tag=" + this.toTag + "\r\n" +
      "Call-ID: 290997367d34cda94f9da5952f20ae12@" +  lIP + ":" + lPort +"\r\n" +
      "CSeq: 103 BYE\r\n" +
      "User-Agent: IonicSIP UA\r\n" +
      "Content-Length: 0\r\n\r\n";

      console.log("Msg to be sent: " + BYE);
      var buf = new ArrayBuffer(BYE.length);
      var bufView = new Uint8Array(buf);
      for (var i=0, strLen=BYE.length; i < strLen; i++) {
          bufView[i] = BYE.charCodeAt(i);
      }
      chrome.sockets.udp.send(this.socket, buf, '72.13.65.18', 5060, (sendInfo) => {
          console.log('Sending BYE: ' + JSON.stringify(sendInfo));   
          console.log('Sending BYE: result ' + sendInfo.resultCode);
      });
    
  }

  UDPReceiveListener = (info) => {
          console.log('Inside UDPListener: ' + this.socket + ":" + info.socketId);
            console.log('Recv from socket: ' + info.remoteAddress + ":" + info.remotePort);
            let response: string = this.ab2str(info.data);// String.fromCharCode.apply(null, new Uint8Array(info.data));
            let firstWord : string =  response.substr(0,3);
            if (firstWord == "SIP") {
              console.log("Recv msg is a Response");
              let responseCode = response.substr(8,3);
              let respCode = Number(responseCode);
              console.log('Recv msg: ' + responseCode);
              if (respCode < 200){
                console.log('Recv temp message');
                return;
              } else if (respCode == 200){
                  if (!this.connected){
                    console.log('Call is accepted, sending ACK');
                    this.SendACK(1, response);
                    return;
                  } else {
                    console.log('Call is terminated');
                  }
              } else {
                console.log('Call is rejected, sending ACK');
                this.SendACK(-1, response);                
              }
            } else {
              console.log("Recv msg is a Request, replying");
              let index : number = response.indexOf(" "); 
              let requestMethod = response.substr(0, index);
              console.log("Recv msg is a Request: " + requestMethod);
              this.SendResponse(requestMethod,response);
            }
            
            chrome.sockets.udp.onReceive.removeListener(this.UDPReceiveListener);
            chrome.sockets.udp.close(info.socketId,() => {
              console.log('Closing socketid: ' + info.socketId);
              this.connected = false;
              console.log('Setting connected flag to false.');
            });         
  }

  startCall(){
    this.connected = false;
    let PORT = 5060;
    this.UDPSend('72.13.65.18',PORT);

  }

  hangupCall(){
    this.SendBYE();
  }

  checkNetworkInfo(){

   let connectSubscription = Network.onConnect().subscribe(() => {
     console.log('network was connected :-)');
     setTimeout(() => {
       //console.log('network type: ' + Network);
       console.log('network Object: ' + JSON.stringify(Network);
     }, 3000);
   );

   let disconnectSubscription = Network.onDisconnect().subscribe(() => {
     console.log('network was disconnected :-(');
   });

  }
}
