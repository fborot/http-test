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
  

  constructor(public navCtrl: NavController, public http: Http) {
    console.log("Constructor called");    
    this.Myhttp = http;
    
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
  
  // str2ab(str) {
  //   var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
  //   var bufView = new Uint16Array(buf);
  //   for (var i=0, strLen=str.length; i < strLen; i++) {
  //   bufView[i] = str.charCodeAt(i);
  //   }
  //   return buf;
  // }


  sendMsg(){

    let OPTIONS : string = "OPTIONS sip:72.13.65.18:5060 SIP/2.0\r\n" +
    "Via: SIP/2.0/UDP 10.100.61.17:41234;branch=z9hG4bK313a.3328fa72.0\r\n" + 
    "To: sip:72.13.65.18:5060\r\n" +
    "From: <sip:3055886662@10.100.61.17>;tag=4f4a12316b227d3fcbd4d3728a5ab380-54ef\r\n" +
    "CSeq: 14 OPTIONS\r\n" +
    "Call-ID: 4070cdfb649ada0d-10455@64.45.157.102\r\n" +
    "Max-Forwards: 70\r\n" +
    "Content-Length: 0\r\n" +
    "User-Agent: IonicSIP UA\r\n\r\n";

  let PORT = 5060;

    var buf = new ArrayBuffer(OPTIONS.length); // 2 bytes for each char
      var bufView = new Uint8Array(buf);
      for (var i=0, strLen=OPTIONS.length; i < strLen; i++) {
        bufView[i] = OPTIONS.charCodeAt(i);
      }

  
    chrome.sockets.udp.create(function(createInfo) {
      console.log('create log ' + createInfo.socketId);
      chrome.sockets.udp.bind(createInfo.socketId, '10.100.61.17', 41234, function(result) {
        //console.log('bind log ' + result);        
        chrome.sockets.udp.send(createInfo.socketId, buf, "72.13.65.18", PORT, function(sendInfo) {
            console.log('send log ' + JSON.stringify(sendInfo));
            chrome.sockets.udp.onReceive.addListener(function(info){
            console.log('Recv from socket: ' + info.remoteAddress + ":" + info.remotePort);
            console.log(info);
          });
          if (sendInfo.resultCode < 0) {
            console.log('send: fail: ' + sendInfo.resultCode);
            chrome.sockets.udp.close(createInfo.socketId);
          } else {
            console.log('send: success ' + sendInfo.resultCode);
            chrome.sockets.udp.close(createInfo.socketId);
          }
        });
      });
    });
  }

}
