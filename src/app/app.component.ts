import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar, Splashscreen } from 'ionic-native';

import { HomePage } from '../pages/home/home';


@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage = HomePage;

  constructor(platform: Platform) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      StatusBar.styleDefault();
      Splashscreen.hide();
/*
      chrome.sockets.udp.create(function(createInfo) { 
      chrome.sockets.udp.bind(createInfo.socketId, '0.0.0.0', 0, function(result) { 
      chrome.sockets.udp.send(createInfo.socketId, data, addr, port, function(result) { 
      if (result < 0) { 
        console.log('send fail: ' + result); 
        chrome.sockets.udp.close(createInfo.socketId); 
      } else { 
        console.log('sendTo: success ' + port); 
        chrome.sockets.udp.close(createInfo.socketId); 
      } 
      }); 
      }); 
      });
*/
    });
  }
}
