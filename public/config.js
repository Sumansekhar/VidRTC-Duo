turnConfig = {
  iceServers: [
    {   urls: [ "stun:bn-turn1.xirsys.com" ]
  }, 
  {  
    username: "RMaQb47OOg_Edy57O6h2dlZIa-Mrm9bfUMfAYV3jjxt3C33RAbgocGter_5uqTbAAAAAAGDM64lzdW1hbnNla2hhcg==",  
    credential: "65e63c08-d066-11eb-8132-0242ac140004",  
    urls: [      
       "turn:bn-turn1.xirsys.com:80?transport=udp",    
       "turn:bn-turn1.xirsys.com:3478?transport=udp",     
       "turn:bn-turn1.xirsys.com:80?transport=tcp",    
       "turn:bn-turn1.xirsys.com:3478?transport=tcp",     
       "turns:bn-turn1.xirsys.com:443?transport=tcp",      
       "turns:bn-turn1.xirsys.com:5349?transport=tcp"   
    ]
  }
 ]

}

