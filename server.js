const os=require("os");
const socketIO=require("socket.io");
const express=require("express");
const http=require("http");
const app=express();
const { v4: uuidv4 } = require("uuid");
const server=http.createServer(app);

app.set("view engine",'ejs');
 app.get("/",(req,res)=>{
   
    res.render("welcome.ejs");
 });
 app.get("/getstarted",(req,res)=>{
   
    res.render("index.ejs",{ roomId: `${uuidv4()}`});
 });
 app.get("/developer",(req,res)=>{
   
    res.render("portfolioindex.ejs");
 });
// ap
// app.get("/", (req, res) => {
    // res.redirect(`/${uuidv4()}`);
//   });
  
//   app.get("/:room", (req, res) => {
//     res.render("room", { roomId: req.params.room });
//   });
  
//Define the folder which contains the CSS and JS for the client side webpage
app.use(express.static("public"));


//Initialize socket.io
var io = socketIO(server);

var numClients = {};

// Convenience function to log server messages on the client.
io.sockets.on("connection",(socket)=>{
    function log()
    {
        let array=["Message coming from the server: "];
        array.push.apply(array,arguments);
        socket.emit("log",array);
    }
   

    socket.on("message",(message,room)=>{
        log("Client: ",message);
        socket.in(room).emit("message",message,room);
       

    });
    socket.on("chatmessage",(message,userName,room)=>{
        io.to(room).emit("createMessage", message, userName);
    })

    socket.on("create or join",(room)=>{
        log('Received request to create or join room ' + room);
      
       
        
        log('Room :' + room + ' now has ' + numClients[room] + ' client(s)');
        if (numClients[room] == undefined) {
            numClients[room] = 0;
        }

        if(numClients[room]===0)
        {
             socket.join(room);
             log('Client ID: ' + socket.id + ' ,created room: ' + room);
             socket.emit("created",room,socket.id);
             numClients[room]++;

        }
        else if(numClients[room]===1)
        {
            log('Client ID: ' + socket.id + ' ,joined room: ' + room);
            io.sockets.in(room).emit("join",room);
            socket.join(room);
            socket.emit('joined', room, socket.id);
            io.sockets.in(room).emit('ready');
            numClients[room]++;
        }
        else
        {
            socket.emit('full', room);
        }

    });

    socket.on('ipaddr',()=>{
        let ifaces=os.networkInterfaces();
        for(let d in ifaces)
        {
            ifaces[d].forEach((details)=>{
              if(details.family==='IPv4' && details.address!=='127.0.0.1')
              {
                  socket.emit('ipaddr',details.address);
              }
            });
        }
    });

    socket.on("bye",()=>{
        console.log("Client Disconneted");
        numClients[room]--;
    });

});


server.listen(process.env.PORT || 5000);



