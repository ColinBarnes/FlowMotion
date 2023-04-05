import { useState } from "react";

type Props = {
    onAudioStream?: (stream: MediaStream) => any,
    onVideoStream?: (stream: MediaStream) => any,
}

const UserMediaSettings = ({onAudioStream, onVideoStream}: Props) => {
    const [devices, setDevices] = useState<MediaDeviceInfo[] | null>(null);
    const [microphone, setMicrophone] = useState<MediaStream | null>(null);
    const [camera, setCamera] = useState<MediaStream | null>(null);

    const handleEnableMediaAccess = async () => {
        const streams = await navigator.mediaDevices.getUserMedia( {video: true, audio: true} );
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        setDevices(deviceList);
        streams.getTracks().forEach( track => { track.stop(); } );
    }
    
    const handleSelectedMicrophone: React.ChangeEventHandler<HTMLSelectElement> = async (e) => {
        if( microphone ) {
            microphone.getTracks().forEach( track => { track.stop(); } );
        }
        if( onAudioStream && e.target.value ) {
            const micStream = await navigator.mediaDevices.getUserMedia( {
                audio: {
                    deviceId: {
                        exact: e.target.value
                    }
                }
            } );
            onAudioStream( micStream );
            setMicrophone( micStream );
        }
    }

    const handleSelectedCamera: React.ChangeEventHandler<HTMLSelectElement> = async (e) => {
        if( camera ) {
            camera.getTracks().forEach( track => { track.stop(); } );
        }
        if( onVideoStream && e.target.value ) {
            const camStream = await navigator.mediaDevices.getUserMedia( {
                video: {
                    deviceId: {
                        exact: e.target.value
                    }
                }
            } );
            onVideoStream( camStream );
            setCamera( camStream );
        }
    }

    return (
        <div>
          {!devices && <button onClick={handleEnableMediaAccess}>Allow Microphone & Webcam Access</button> }
          {devices &&
            <>
              <span>Microphone</span>
              <select name="microphone" onChange={handleSelectedMicrophone}>
                {devices?.filter( device => (device.deviceId !== '') && (device.kind === 'audioinput'))
                  .map( device => <option key={`${device.groupId}-${device.deviceId}`} value={device.deviceId}>{device.label}</option>)}
              </select>
            </>
          }
          {devices &&
            <>
              <span>Camera</span>
              <select name="camera" onChange={handleSelectedCamera}>
                {devices?.filter( device => (device.deviceId !== '') && (device.kind === 'videoinput'))
                  .map( device => <option key={`${device.groupId}-${device.deviceId}`} value={device.deviceId}>{device.label}</option>)}
              </select>
            </>
          }
        </div>
    );
}

export default UserMediaSettings;