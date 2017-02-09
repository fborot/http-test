import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import xml2js from 'xml2js'; 
import { Network} from 'ionic-native';

declare const chrome;
declare const audioinput;

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

  totalReceivedData : number;  
  captureCfg : any;
  audioDataQueue : number[];// = new Array(32000);
  RTPMarkerFlag : boolean;
  audioDataQueue1 : number[];// = new Array(32000);
  audioDataQueue2: number[];// = new Array(32000);
  audioDataQueue3 : number[];// = new Array(32000);
  currentQueue : number;
  currentQueueSend : number;
  currentChunk : number;
  isDataFromMic : boolean;

  bufferArray : number;

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

    this.totalReceivedData = 0;
    this.audioDataQueue;// = [];
    this.RTPMarkerFlag = false;
    this.bufferArray = 4800;
    this.audioDataQueue1 = new Array(this.bufferArray);
    this.audioDataQueue2 = new Array(this.bufferArray);
    this.audioDataQueue3 = new Array(this.bufferArray);
    this.currentQueue = 0;
    this.currentQueueSend = 0;
    this.currentChunk = 0;
    this.isDataFromMic = false;

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
      let lIP : string = "10.100.61.43"; //"";

      this.socket = createInfo.socketId;
      console.log('After assigning socketid: ' + this.socket + ":" + createInfo.socketId);
      chrome.sockets.udp.bind(createInfo.socketId, "10.100.61.43", 45678, (result) => {
        console.log('Bind result: ' + result);
        console.log('new value: ' + createInfo.socketId);    
        chrome.sockets.udp.getInfo(createInfo.socketId, (socketInfo) => {
          lIP = "10.100.61.43";//socketInfo.localAddress;
          lPort = socketInfo.localPort;
          console.log('Socket_IP:Port ' + JSON.stringify(socketInfo) +  ":" + lIP +  ":" + lPort);

          chrome.sockets.udp.onReceive.addListener(this.UDPReceiveListener);
          let SDP = "v=0\r\n" +
            "o=root 1313952988 1313952988 IN IP4 " + lIP + "\r\n" +
            "s=IonicSIP UA 1.0.0\r\n" +
            "c=IN IP4 " + lIP + "\r\n" +
            "t=0 0\r\n" +
            "m=audio 20000 RTP/AVP 0 101\r\n" +
            "a=rtpmap:0 PCMU/8000\r\n"
            "a=rtpmap:101 telephone-event/8000\r\n" +
            "a=fmtp:101 0-16\r\n" +
            "a=ptime:20\r\n" +
            "a=sendrecv\r\n\r\n"; 

          let INVITE : string = "INVITE sip:30307867384561@72.13.65.18 SIP/2.0\r\n" +
            "Via: SIP/2.0/UDP " + lIP + ":" + lPort +";branch=z9hG4bK" + this.viaBranch1 +"\r\n" +
            "Max-Forwards: 70\r\n" +
            "From: <sip:3055886662@" +  lIP + ":" + lPort +">;tag=as0dc3ed07\r\n" +
            "To: <sip:30307867384561@72.13.65.18>\r\n" +
            "Contact: <sip:3055886662@" +  lIP + ":" + lPort +">\r\n" +
            "Call-ID: " + this.callID + "@" +  lIP + ":" + lPort +"\r\n" +
            "CSeq: 102 INVITE\r\n" +
            "User-Agent: IonicSIP UA\r\n" +
            "Date: Wed, 01 Feb 2017 14:09:52 GMT\r\n" +
            "Allow: INVITE, ACK, CANCEL, OPTIONS, BYE, REFER, SUBSCRIBE, NOTIFY, INFO, PUBLISH, MESSAGE\r\n" +
            "Supported: replaces, timer\r\n" +
            "Content-Type: application/sdp\r\n" +
            "Content-Length: " + SDP.length + "\r\n\r\n" + SDP

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
    let lIP : string = "10.100.61.43";
    let lviaBranch : string = "";
    let RURI : string = "";
    let toTag : string =  "";

    if (ackType < 0){
      console.log('Inside SendACK. Preparing ACK for a Rejected Request.');
      lviaBranch = "z9hG4bK" + this.viaBranch1;
      RURI = "430307867384561@72.13.65.66";
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
      "To: <sip:30307867384561@72.13.65.18>;tag=" + toTag +"\r\n" +
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
    let lIP : string = "10.100.61.43"; //"";
  
    console.log('Inside SendBYE. Preparing BYE to terminate call.');
   
    let BYE = "BYE sip:430307867384561@72.13.65.66:5060 SIP/2.0\r\n" +
      "Via: SIP/2.0/UDP " + lIP + ":" + lPort +";branch=z9hG4bK" + this.viaBranch3 + "\r\n" +
      "Route: <sip:72.13.65.18;lr>\r\n" +
      "Max-Forwards: 70\r\n" +
      "From: <sip:7867384561@" + lIP + ":" + lPort +">;tag=as0dc3ed07\r\n" +
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
    if (info.socketId === this.RTPSocket){
      let RTPPacketReceived : Uint8Array= new Uint8Array(info.data);
      // if (++this.countRTPPacketsreceived % 10 == 0 )
      //   console.log('RTP packet received: ' + this.countRTPPacketsreceived);

        this.sendRTPPacket('10.100.61.43',20000, this.remoteRTPIP, Number(this.remoteRTPPort));
      return;
    } else if (info.socketId == this.socket) {
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
              this.startRTPSession('10.100.61.43',20000, this.remoteRTPIP, Number(this.remoteRTPPort));
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
    } else {
      console.log('Inside UDPListener: ' + JSON.stringify(info));
      return;
    }
            
    chrome.sockets.udp.onReceive.removeListener(this.UDPReceiveListener);
    //chrome.sockets.udp.onReceive.removeListener(this.RTPReceiveListener);

    chrome.sockets.udp.close(this.RTPSocket,() => {
      console.log('Closing RTP socketid: ' + this.RTPSocket);
      this.RTPSessionActive = false;
      console.log('Setting RTPSession flag to false.');
      audioinput.stop();
      this.RTPMarkerFlag = true;
      this.isDataFromMic = false;
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
   //console.log('Subscribed!!');
   console.log('network type: ' + Network.type);
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

    this.captureCfg = {
      sampleRate: audioinput.SAMPLERATE.TELEPHONE_8000Hz,
      bufferSize: this.bufferArray,
      channels: audioinput.CHANNELS.MONO,
      format: audioinput.FORMAT.PCM_8BIT,
      normalize: true,
      normalizationFactor: 5,//32767.0,
      streamToWebAudio: false,
      //audioContext: null,
      concatenateMaxChunks: 2,
      audioSourceType: audioinput.AUDIOSOURCE_TYPE.DEFAULT
    };

    chrome.sockets.udp.create((createInfo) => {
      console.log('RTP:Socket Id created ' + createInfo.socketId);
      let lPort : number = 20000;//-1;
      let lIP : string = "10.100.61.43"; //"";

      this.RTPSocket = createInfo.socketId;
      console.log('RTP:After assigning socketid: ' + this.RTPSocket + ":" + createInfo.socketId);
      chrome.sockets.udp.bind(createInfo.socketId, "10.100.61.43", 20000, (result) => {
        console.log('RTP:Bind result: ' + result); 
        (<any>window).addEventListener('audioinput', this.onAudioInputCapture, false);
        audioinput.start( this.captureCfg );
        this.sendRTPPacket(lIP, lRTPPort, remRTPIP, Number(remRTPPort));
      });//socket bind
    });//socket create
  }

  onAudioInputCapture = ((evt) => {   
    console.log("inside event handler: %d",this.currentQueue);
    
    if(!this.isDataFromMic)
      this.isDataFromMic = true;
    
     try { 
         if (evt && evt.data) {
           this.totalReceivedData += evt.data.length;
           if (this.currentQueue == 0){
            this.copyArray(evt.data,this.audioDataQueue1);
            console.log("inside event handler1_%d ", this.currentQueue);
           } else if (this.currentQueue == 1) {             
            this.copyArray(evt.data,this.audioDataQueue2);
            console.log("inside event handler1_%d ", this.currentQueue);
           } else if (this.currentQueue == 2) {            
            this.copyArray(evt.data,this.audioDataQueue3);
            console.log("inside event handler1_%d ", this.currentQueue);
           }
           this.currentQueue++;
           this.currentQueue = this.currentQueue == 3 ? 0 : this.currentQueue;
         } 
     } 
     catch (ex) {
         console.log("exception inside event handler: " + ex);
    } 
  })

  sendRTPPacketOLD = (lIP: string, lRTPPort : number, remRTPIP : string, remRTPPort : number) => {    
    
    let t1 = new Date().getMilliseconds();
    let RTPHeader : number[] = [] ; //[128,128,201,199,26,20,231,240,19,250,55,146];
    let RTPPayload : number [];
    if (this.audioDataQueue.length > 160){
      RTPPayload = this.audioDataQueue.splice(0,160);
      this.fromPCMToULaw(RTPPayload);
      if (this.RTPMarkerFlag == false){
        this.RTPMarkerFlag = true;
        Array.prototype.push.apply(RTPHeader,[128,128]);
      } else {
        Array.prototype.push.apply(RTPHeader,[128,0]);
        this.RTPSequenceStart++;
        this.RTPTimestampStart += 160;
      }
    } else {
      return;
    }    
    let seq : number[] = this.int2ByteArray(this.RTPSequenceStart,2);
    Array.prototype.push.apply(RTPHeader,seq);    
    let ts : number[] = this.int2ByteArray(this.RTPTimestampStart,4);
    Array.prototype.push.apply(RTPHeader,ts);  
    let ident : number[] = this.int2ByteArray(this.RTPSynchronizationIdentifier,4);
    Array.prototype.push.apply(RTPHeader,ident);
    
    let RTPPacket : number[] = RTPHeader.concat(RTPPayload);

    //console.log("Msg to be sent: " + JSON.stringify(RTPPacket));
    var buf = new ArrayBuffer(RTPPacket.length);
    var bufView = new Uint8Array(buf);
    for (var i=0, strLen=RTPPacket.length; i < strLen; i++) {
        bufView[i] = RTPPacket[i];
    }
    chrome.sockets.udp.send(this.RTPSocket, buf, remRTPIP, remRTPPort, (sendInfo) => {
        //console.log('RTP:Inside Send: ' + JSON.stringify(sendInfo));    
        if (sendInfo.resultCode < 0) {
          console.log('RTP:Send: fail: ' + sendInfo.resultCode);
          chrome.sockets.udp.close(this.RTPSocket);
        } else {          
          if (!this.RTPSessionActive)
            this.RTPSessionActive = true;

          let diff : number = ( new Date().getMilliseconds() - t1);
          if (diff > 10)
            console.log('Time spent: ' + ( new Date().getMilliseconds() - t1) );
        }
    })//socket send
  }

  sendRTPPacket = (lIP: string, lRTPPort : number, remRTPIP : string, remRTPPort : number) => {   

    let t1,t2,t3;
    t1 = new Date().getMilliseconds();
    let RTPHeader : number[] = new Array(12); //[128,128,201,199,26,20,231,240,19,250,55,146];
    let RTPPayload : number [] = new Array(160);
    let RTPPacket : number[] = new Array(172);
    if (this.isDataFromMic) {
      console.log('Inside isDataFromMic_%d: %d', t1, this.currentQueueSend);
      if (this.currentQueueSend == 0) {
        this.copyPartArray(this.audioDataQueue1,RTPPayload);       
      } else if (this.currentQueueSend == 1){
        this.copyPartArray(this.audioDataQueue2,RTPPayload);         
      } else if (this.currentQueueSend == 2){
        this.copyPartArray(this.audioDataQueue3,RTPPayload);      
      }
      //console.log('Payload: ' + JSON.stringify(RTPPayload)); 
      this.fromPCMToULaw(RTPPayload);   
      if (this.RTPMarkerFlag == false){
        this.RTPMarkerFlag = true;
        RTPHeader[0] = 128;
        RTPHeader[1] = 128;
      } else {
        RTPHeader[0] = 128;
        RTPHeader[1] = 0;
        this.RTPSequenceStart++;
        this.RTPTimestampStart += 160;
      }
    } else {
      return;
    }

    let seq : number[] = this.int2ByteArray(this.RTPSequenceStart,2);
    RTPHeader[2] = seq[0];  RTPHeader[3] = seq[1];
    let ts : number[] = this.int2ByteArray(this.RTPTimestampStart,4);
    RTPHeader[4] = ts[0]; RTPHeader[5] = ts[1]; RTPHeader[6] = ts[2]; RTPHeader[7] = ts[3];  
    let ident : number[] = this.int2ByteArray(this.RTPSynchronizationIdentifier,4);
    RTPHeader[8] = ident[0];  RTPHeader[9] = ident[1];  RTPHeader[10] = ident[2]; RTPHeader[11] = ident[3];   

    this.createRTPPacket(RTPHeader,RTPPayload,RTPPacket);    

    var buf = new ArrayBuffer(RTPPacket.length);
    var bufView = new Uint8Array(buf);
    for (var i = 0, strLen=RTPPacket.length; i < strLen; i++) {
        bufView[i] = RTPPacket[i];
    }

    t2 = new Date().getMilliseconds();
    //console.log('Payload1: ' + JSON.stringify(bufView));
    setTimeout(() => {
      chrome.sockets.udp.send(this.RTPSocket, buf, remRTPIP, remRTPPort, (sendInfo) => {
          if (sendInfo.resultCode < 0) {
            console.log('RTP:Send: fail: ' + sendInfo.resultCode);
            chrome.sockets.udp.close(this.RTPSocket);
          } else {          
            if (!this.RTPSessionActive)
              this.RTPSessionActive = true;
          }
      })//socket 
    }, 0);

    t3 = new Date().getMilliseconds();
    //console.log('Times: %d %d', (t2-t1), (t3-t2));
  }
  
  int2ByteArray = (num: number, len : number) : number[] => {
    let byteArray: number[];
    if (len == 2){
      byteArray = [0, 0];
    } else {
      byteArray = [0, 0, 0, 0];
    }
    for ( var index = 0; index < byteArray.length; index ++ ) {
        var byte = num & 0xff;
        byteArray [ index ] = byte;
        num = (num - byte) / 256 ;
    }
    return byteArray.reverse(); 
  }

  aLawEncode = (pcm : number) : number => {

    const ALAW_MAX : number = 4095;//0xFFF;
    let mask : number = 2048;// 0x800;
    let sign : number = 0;
    let position : number = 11;
    let lsb : number= 0;
    if (pcm < 0)
    {
        pcm = -pcm;
        sign = 0x80;
    }
    if (pcm > ALAW_MAX)
    {
        pcm = ALAW_MAX;
    }
    for (; ((pcm & mask) != mask && position >= 5); mask >>= 1, position--);
    lsb = (pcm >> ((position == 4) ? (1) : (position - 4))) & 0x0f;
    return (sign | ((position - 4) << 4) | lsb) ^ 0x55;

  }

  fromPCMToALaw = (buff_array : number[]) => {
    let i : number = 0;
    for (i = 0 ; i < buff_array.length; i++) {
      buff_array[i] = this.aLawEncode(buff_array[i]);
    }
  }

  uLawEncode = (pcm : number) : number => {

   const  MULAW_MAX = 4095;//0x1FFF;
   const  MULAW_BIAS = 33;
   let mask : number = 4096;//0x1000;
   let sign : number = 0;
   let position : number = 12;
   let lsb : number = 0;
   if (pcm < 0)
   {
      pcm  = -pcm ;
      sign = 0x80;
   }
   pcm  += MULAW_BIAS;
   if (pcm  > MULAW_MAX)
   {
      pcm  = MULAW_MAX;
   }
   for (; ((pcm  & mask) != mask && position >= 5); mask >>= 1, position--)
        ;
   lsb = (pcm  >> (position - 4)) & 0x0f;
   return (~(sign | ((position - 5) << 4) | lsb));

  }

  fromPCMToULaw = (buff_array : number[]) => {
    let i : number = 0;
    for (i = 0 ; i < buff_array.length; i++) {
      buff_array[i] = this.uLawEncode(buff_array[i]);
    }
  }

  copyArray = (arr1: number[], arr2: number[]) => {
    let i : number = 0; 
    for (i = 0; i < arr1.length; i++){
      arr2[i] = arr1[i];
    }
  }  

  copyPartArray = (arr1: number[], arr2: number[]) => {
    let start : number = 0; 
    let end : number = 0; 
    let i : number = 0;
    let index : number = 0;
    this.currentChunk++;
    if (this.currentChunk == 31){
      this.currentChunk = 1;
      this.currentQueueSend++;
      this.currentQueueSend = this.currentQueueSend == 3 ? 0 : this.currentQueueSend;
    }

    start = (this.currentChunk -1) * 160;
    end = this.currentChunk * 160;

    // switch(this.currentChunk){
    //   case 1:
    //   start = 0; end = 160;
    //   break;
    //   case 2:
    //   start = 160; end = 320;
    //   break;
    //   case 3:
    //   start = 320; end = 480;
    //   break;
    //   case 4:
    //   start = 480; end = 640;
    //   break;
    //   case 5:
    //   start = 640; end = 800;
    //   break;
    //   case 6:
    //   start = 800; end = 960;
    //   break;
    //   case 7:
    //   start = 960; end = 1120;
    //   break;
    //   case 8:
    //   start = 1120; end = 1280;
    //   break;
    //   case 9:
    //   start = 1280; end = 1440;
    //   break;
    //   case 10:
    //   start = 1440; end = 1600;
    //   break;     
    // }
    
    for (i = start, index = 0; i < end; i++, index++){
      arr2[index] = arr1[i];
    }
  }  

  createRTPPacket = (arrHeader : number[], arrPayload : number[], arrPacket : number[]) =>{
    let i : number = 0;
    for (i = 0; i < 12; i++){
      arrPacket[i] = arrHeader[i];
    }
    for (i = 0; i < 160; i++){
      arrPacket[12 + i] = arrPayload[i];
    }
  }

}
