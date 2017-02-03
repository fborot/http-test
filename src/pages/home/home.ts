import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import xml2js from 'xml2js'; 
import { Network} from 'ionic-native';

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
  callID : string;
  fromTag : string;
  viaBranch1 : string;
  viaBranch2 : string;
  viaBranch3 : string;
  localRTPPort : string;
  remoteRTPIP : string;
  remoteRTPPort : string;
  RTPSocket : any;
  RTPSequenceStart : number;
  RTPTimestampStart : number;
  RTPSynchronizationIdentifier : number;
  RTPSessionActive : boolean;
  countRTPPacketsreceived : number;

  constructor(public navCtrl: NavController, public http: Http) {
    console.log("Constructor called");    
    this.Myhttp = http;
    this.socket = -1;
    this.connected = false;
    this.toTag = "";
    this.callID = "";
    this.fromTag = "";
    this.viaBranch1 = "";
    this.viaBranch2 = "";
    this.viaBranch3 = "";
    this.localRTPPort = "";
    this.remoteRTPIP = "";
    this.remoteRTPPort = "";
    this.RTPSocket = -1;
    this.RTPSequenceStart = 0;
    this.RTPTimestampStart = 0;
    this.RTPSynchronizationIdentifier = 0;
    this.RTPSessionActive = false;
    this.countRTPPacketsreceived = 0;
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

  ab2str16(buf){
    return String.fromCharCode.apply(null, new Uint16Array(buf));
  }

  ab2int(buf) {
    let i : number = 0;
    let intArray = new Uint8Array(buf.length);
    for (i = 0; i < buf.len; i++){
      intArray[i] = buf[i];
    }
    return intArray;
  }

  hex2a(hexx) {
    var hex = hexx.toString();//force conversion
    var str = '';
    for (var i = 0; i < hex.length; i++)
        str += String.fromCharCode(parseInt(hex.substr(i, 1), 8));
    return str;
  }

  createRandomStrings = () => {
    let result : string ="";
    let chars : string = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'; 
    let i : number = 0;
    let len : number = 60;
    for (i = 0; i < len; i++){
      result += chars[Math.round(Math.random() * (chars.length - 1))];      
    }
    this.callID = result.substr(0,20);
    this.fromTag = result.substr(20,10);
    this.viaBranch1 = result.substr(30,10);
    this.viaBranch2 = result.substr(40,10);
    this.viaBranch3 = result.substr(50,10);
  }

  UDPSend = (remoteIP : string, remotePort: number) => {
    chrome.sockets.udp.create((createInfo) => {
      console.log('Socket Id created ' + createInfo.socketId);
      let lPort : number = 45678;//-1;
      let lIP : string = "10.100.61.25"; //"";

      this.socket = createInfo.socketId;
      console.log('After assigning socketid: ' + this.socket + ":" + createInfo.socketId);
      chrome.sockets.udp.bind(createInfo.socketId, "10.100.61.25", 45678, (result) => {
        console.log('Bind result: ' + result);
        console.log('new value: ' + createInfo.socketId);    
        chrome.sockets.udp.getInfo(createInfo.socketId, (socketInfo) => {
          lIP = "10.100.61.25";//socketInfo.localAddress;
          lPort = socketInfo.localPort;
          console.log('Socket_IP:Port ' + JSON.stringify(socketInfo) +  ":" + lIP +  ":" + lPort);

          chrome.sockets.udp.onReceive.addListener(this.UDPReceiveListener);

          let INVITE : string = "INVITE sip:30307864723569@72.13.65.18 SIP/2.0\r\n" +
            "Via: SIP/2.0/UDP " + lIP + ":" + lPort +";branch=z9hG4bK" + this.viaBranch1 +"\r\n" +
            "Max-Forwards: 70\r\n" +
            "From: <sip:3055886662@" +  lIP + ":" + lPort +">;tag=as0dc3ed07\r\n" +
            "To: <sip:30307864723569@72.13.65.18>\r\n" +
            "Contact: <sip:3055886662@" +  lIP + ":" + lPort +">\r\n" +
            "Call-ID: " + this.callID + "@" +  lIP + ":" + lPort +"\r\n" +
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
            "m=audio 20000 RTP/AVP 0 18 8 101\r\n" +
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
    let lIP : string = "10.100.61.25";
    let lviaBranch : string = "";
    let RURI : string = "";
    let toTag : string =  "";

    if (ackType < 0){
      console.log('Inside SendACK. Preparing ACK for a Rejected Request.');
      lviaBranch = "z9hG4bK" + this.viaBranch1;
      RURI = "430307864723569@72.13.65.66";
    } else {
      console.log('Inside SendACK. Preparing ACK for an Accepted Request.');
      lviaBranch = "z9hG4bK" + this.viaBranch2;
      let index1 : number = msg.indexOf("Contact: <sip:") + 14;
      let index2 : number = msg.indexOf(">\r\n",index1);
      RURI = msg.substr(index1, index2 - index1);      
    }

    let index1 : number = msg.indexOf("To:");
    let index2 : number = msg.indexOf(";tag=",index1) + 5;
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
      "Call-ID: " + this.callID + "@" +  lIP + ":" + lPort +"\r\n" +
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
    let lIP : string = "10.100.61.25"; //"";
  
    console.log('Inside SendBYE. Preparing BYE to terminate call.');
   
    let BYE = "BYE sip:430307864723569@72.13.65.66:5060 SIP/2.0\r\n" +
      "Via: SIP/2.0/UDP " + lIP + ":" + lPort +";branch=z9hG4bK" + this.viaBranch3 + "\r\n" +
      "Route: <sip:72.13.65.18;lr>\r\n" +
      "Max-Forwards: 70\r\n" +
      "From: <sip:7864723569@" + lIP + ":" + lPort +">;tag=as0dc3ed07\r\n" +
      "To: <sip:30303055886662@72.13.65.18>;tag=" + this.toTag + "\r\n" +
      "Call-ID: " + this.callID + "@" +  lIP + ":" + lPort +"\r\n" +
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
    if (info.socketId === this.RTPSocket){
      let RTPPacketReceived : Uint8Array= new Uint8Array(info.data);
      console.log('RTP packet received0: ' + info);
      //console.log('RTP packet received1: ' + JSON.parse(info.data));
      console.log('RTP packet received2: ' + (++this.countRTPPacketsreceived) + " : " + JSON.stringify(RTPPacketReceived));
      return;
    }
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
            console.log('Call is accepted, extracting remote RTP info and sending ACK');
            this.extractRTPInfo(response);
            this.SendACK(1, response);
            this.startRTPSession('10.100.61.25',20000, this.remoteRTPIP, Number(this.remoteRTPPort));
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
    //chrome.sockets.udp.onReceive.removeListener(this.RTPReceiveListener);

    chrome.sockets.udp.close(this.RTPSocket,() => {
      console.log('Closing RTP socketid: ' + this.RTPSocket);
      this.RTPSessionActive = false;
      console.log('Setting RTPSession flag to false.');
    });  
    chrome.sockets.udp.close(this.socket,() => {
      console.log('Closing SIP socketid: ' + info.socketId);
      this.connected = false;
      console.log('Setting connected flag to false.');
    });         
  }

  startCall(){
    this.connected = false;
    let PORT = 5060;
    this.createRandomStrings();
    

    this.UDPSend('72.13.65.18',PORT);

  }

  hangupCall(){
    this.SendBYE();
  }

  checkNetworkInfo(){
   console.log('Subscribed!!');

   let connectSubscription = Network.onConnect().subscribe(() => {
     console.log('network was connected :-)');
     setTimeout(() => {
       console.log('network type: ' + Network.type);
     }, 3000);
   });

   let disconnectSubscription = Network.onDisconnect().subscribe(() => {
     console.log('network was disconnected :-(');
   });

  }

  extractRTPInfo = (msg: string) => {
    let index1 : number = msg.indexOf("c=IN IP4 ") + 9;
    let index2 : number = msg.indexOf("\r\n",index1);
    this.remoteRTPIP = msg.substr(index1,index2 - index1);
    index1 = index2 = 0;

    index1 = msg.indexOf("m=audio ") + 8;
    index2 = msg.indexOf(" ",index1);
    this.remoteRTPPort = msg.substr(index1,index2 - index1);

    console.log("Remote RTP info: " + this.remoteRTPIP + ":" + this.remoteRTPPort);

  }

  startRTPSession = (lIP: string, lRTPPort : number, remRTPIP : string, remRTPPort : number) => {

    this.RTPSequenceStart = 51655;                //randomize these 3 valuesper call later
    this.RTPTimestampStart = 437577712;
    this.RTPSynchronizationIdentifier = 335165330;

    chrome.sockets.udp.create((createInfo) => {
      console.log('RTP:Socket Id created ' + createInfo.socketId);
      let lPort : number = 20000;//-1;
      let lIP : string = "10.100.61.25"; //"";

      this.RTPSocket = createInfo.socketId;
      console.log('RTP:After assigning socketid: ' + this.RTPSocket + ":" + createInfo.socketId);
      chrome.sockets.udp.bind(createInfo.socketId, "10.100.61.25", 20000, (result) => {
        console.log('RTP:Bind result: ' + result); 
        chrome.sockets.udp.getInfo(createInfo.socketId, (socketInfo) => {
            lIP = "10.100.61.25";//socketInfo.localAddress;
            lPort = socketInfo.localPort;
            console.log('Socket_IP:Port ' + JSON.stringify(socketInfo) +  ":" + lIP +  ":" + lPort);

            //chrome.sockets.udp.onReceive.addListener(this.RTPReceiveListener);
            let RTPHeader : number[] = [128,128,201,199,26,20,231,240,19,250,55,146];
            let RTPPayload : number[] = [235,218,102,111,140,115,95,177,96,33,173,102,129,158,21,224,144,194,224,0,106,238,138,6,46,21,120,210,251,17,66,188,129,252,241,247,252,193,189,141,216,73,8,139,194,167,140,245,100,227,194,142,150,37,173,233,158,103,150,191,154,107,132,251,184,187,149,32,220,187,11,21,195,166,160,49,42,126,165,213,180,198,60,75,212,120,198,216,4,5,140,222,60,94,117,193,219,234,120,154,201,163,45,173,66,223,134,24,108,192,139,211,1,194,178,102,33,89,240,49,171,11,78,97,135,29,205,182,89,72,143,210,198,221,154,214,43,180,81,140,149,124,95,138,252,98,169,40,225,     206,88,39,143,133,193,112,98,85,30];

            let RTPPacket : number[] = RTPHeader.concat(RTPPayload);

            console.log("Msg to be sent: " + JSON.stringify(RTPPacket));
            var buf = new ArrayBuffer(RTPPacket.length);
            var bufView = new Uint8Array(buf);
            for (var i=0, strLen=RTPPacket.length; i < strLen; i++) {
                bufView[i] = RTPPacket[i];
            }
            chrome.sockets.udp.send(createInfo.socketId, buf, remRTPIP, remRTPPort, (sendInfo) => {
                console.log('RTP:Inside Send: ' + JSON.stringify(sendInfo));    
                if (sendInfo.resultCode < 0) {
                  console.log('RTP:Send: fail: ' + sendInfo.resultCode);
                  chrome.sockets.udp.close(createInfo.socketId);
                } else {
                  this.RTPSessionActive = true;
                  console.log('RTP:Send: success ' + sendInfo.resultCode);
                }
            });//socket send
        });
      });//socket bind
    });//socket create
  }

  // RTPReceiveListener = (info) => {
  //     console.log('Inside RTPListener: ' + this.RTPSocket + ":" + info.socketId);
  //     console.log('Recv from socket: ' + info.remoteAddress + ":" + info.remotePort);
  //     console.log('RTP packet received: ' + JSON.stringify(info.data));
    
  //     chrome.sockets.udp.close(info.socketId,() => {
  //       console.log('Closing socketid: ' + info.socketId);
  //     });     
  // }

}
