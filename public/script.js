const socket = io('/');
console.log("Socket connected:", socket.connected);

const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer(undefined,{
    host: '/',
    port: '3001'
})


const muteButton = document.getElementById('muteButton');
const videoButton = document.getElementById('videoButton');
const shareScreenButton = document.getElementById('shareScreenButton');
const disconnectButton = document.getElementById('disconnectButton');

disconnectButton.addEventListener('click', () => {
    window.location.href = `http://localhost:8000/room`;
});

let isMuted = false;
muteButton.addEventListener('click', () => {
    isMuted = !isMuted;
    const audioTracks = myVideo.srcObject.getAudioTracks();
    if (audioTracks.length > 0) {
        audioTracks[0].enabled = !isMuted;
        muteButton.innerText = isMuted ? 'Unmute' : 'Mute';
    } else {
        console.warn('No audio tracks found.');
    }
});


let isVideoStopped = false;
videoButton.addEventListener('click', () => {
    isVideoStopped = !isVideoStopped;
    myVideo.srcObject.getVideoTracks()[0].enabled = !isVideoStopped;
    videoButton.innerText = isVideoStopped ? 'Start Video' : 'Stop Video';
});

shareScreenButton.addEventListener('click', async () => {
    try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenVideo = document.createElement('video');
        addVideoStream(screenVideo, screenStream);
    } catch (error) {
        console.error('Error sharing screen:', error);
    }
});


const myVideo = document.createElement('video')
myVideo.muted = true
const peers = {}
navigator.mediaDevices.getUserMedia({
    video : true,
    audio : true
}).then(stream =>{
    addVideoStream(myVideo,stream)

    myPeer.on('call',call =>{
        call.answer(stream)
        const video = document.createElement('video')
        call.on('stream',userVideoStream => {
            addVideoStream(video,userVideoStream)
        })
    })

    socket.on('user-connected',userId =>{
        connectToNewUser(userId,stream)
    })
})

socket.on('user-disconnected',userId =>{
    if(peers[userId])peers[userId].close()
})

myPeer.on('open',id => {
    socket.emit('join-room',ROOM_ID,id)
})


function connectToNewUser(userId,stream)
{
    const call = myPeer.call(userId,stream)
    const video = document.createElement('video')
    call.on('stream',userVideoStream => {
        addVideoStream(video,userVideoStream)
    })
    call.on('close', ()=>{
        video.remove()
    })

    peers[userId] = call
}

function addVideoStream(video,stream)
{
    video.srcObject = stream
    video.addEventListener('loadedmetadata',()=>{
        video.play()
    })
    videoGrid.append(video)
}