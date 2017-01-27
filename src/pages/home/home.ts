import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import xml2js from 'xml2js'; 
import dgram from 'dgram';

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
  
  sendMsg(){

    let server = dgram.createSocket('udp4');

    server.on('error', (err) => {
      console.log(`server error:\n${err.stack}`);
      server.close();
    });

    server.on('message', (msg, rinfo) => {
      console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
    });

    server.on('listening', () => {
      let address = server.address();
      console.log(`server listening ${address.address}:${address.port}`);
    });
    let OPTIONS = "OPTIONS sip:72.13.65.18:5060 SIP/2.0\r\n" +
    "Via: SIP/2.0/UDP 172.31.196.224:41234;branch=z9hG4bK313a.3328fa72.0\r\n" + 
    "To: sip:72.13.65.18:5060\r\n" +
    "From: <sip:3055886662@sip.blitztelus.com>;tag=4f4a12316b227d3fcbd4d3728a5ab380-54ef\r\n" +
    "CSeq: 14 OPTIONS\r\n" +
    "Call-ID: 4070cdfb649ada0d-10455@64.45.157.102\r\n" +
    "Max-Forwards: 70\r\n" +
    "Content-Length: 0\r\n" +
    "User-Agent: SBC VSX v1.9.1\r\n\r\n";

    server.bind(41234,"172.31.196.224");

    server.send(OPTIONS,0,OPTIONS.length,5060,"72.13.65.18");
  }
}
