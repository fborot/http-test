import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import xml2js from 'xml2js'; 

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

  constructor(public navCtrl: NavController, public http: Http) {
    console.log("Constructor called");    
    this.Myhttp = http;
    this.socket = -1;
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

  UDPSend(parent_this : any, remoteIP : string, remotePort: number){
    chrome.sockets.udp.create(function(createInfo) {
      console.log('Socket Id created ' + createInfo.socketId);
      let lPort : number = 45678;//-1;
      let lIP : string = "10.100.61.17"; //"";
      // chrome.sockets.udp.getInfo(createInfo.socketId,function(socketInfo){
      //   lIP = socketInfo.localAddress;
      //   lPort = socketInfo.localPort;
      //   console.log('Socket_IP:Port ' + lIP +  ":" + lPort);
      // });
      parent_this.socket = createInfo.socketId;
      chrome.sockets.udp.bind(createInfo.socketId, lIP, lPort, function(result) {
        console.log('Bind result: ' + result);    
        chrome.sockets.udp.onReceive.addListener(parent_this.UDPReceiveListener);   
        let OPTIONS : string = "OPTIONS sip:72.13.65.18:5060 SIP/2.0\r\n" +
          "Via: SIP/2.0/UDP " + lIP + ":" + lPort +";branch=z9hG4bK313a.3328fa72.0\r\n" + 
          "To: sip:72.13.65.18:5060\r\n" +
          "From: <sip:3055886662@" +  lIP + ":" + lPort +">;tag=4f4a12316b227d3fcbd4d3728a5ab380-54ef\r\n" +
          "CSeq: 14 OPTIONS\r\n" +
          "Call-ID: 4070cdfb649ada0d-10455@64.45.157.102\r\n" +
          "Max-Forwards: 70\r\n" +
          "Content-Length: 0\r\n" +
          "User-Agent: IonicSIP UA\r\n\r\n";

        var buf = new ArrayBuffer(OPTIONS.length);
        var bufView = new Uint8Array(buf);
        for (var i=0, strLen=OPTIONS.length; i < strLen; i++) {
            bufView[i] = OPTIONS.charCodeAt(i);
        }
        chrome.sockets.udp.send(createInfo.socketId, buf, remoteIP, remotePort, function(sendInfo) {
            console.log('Inside Send: ' + JSON.stringify(sendInfo));    
          if (sendInfo.resultCode < 0) {
            console.log('Send: fail: ' + sendInfo.resultCode);
            chrome.sockets.udp.close(createInfo.socketId);
          } else {
            console.log('Send: success ' + sendInfo.resultCode);
          }
        });
      });
    });

  }

  UDPReceiveListener(info){
    if (this.socket == info.socketId) {
      console.log('Recv from socket: ' + info.remoteAddress + ":" + info.remotePort);
      let response: string = this.ab2str(info.data);// String.fromCharCode.apply(null, new Uint8Array(info.data));
      console.log('Recv msg: ' + response);
      console.log('socketId: ' + info.socketId);
      chrome.sockets.udp.close(info.socketId,function(){
        console.log('Closing socketid: ' + info.socketId);
      });
    }
  }
  

  sendMsg(){

    let PORT = 5060;
    let self = this;

    this.UDPSend(this,'72.13.65.18',PORT);


  }

}
