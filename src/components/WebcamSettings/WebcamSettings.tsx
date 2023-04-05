import { useState } from "react";
import { BiCamera, BiCameraOff } from "react-icons/bi"

type Props = {
    onVideoStream?: (stream: MediaStream) => any,
}

const WebcamSettings = ({ onVideoStream }: Props) => {
    const [devices, setDevices] = useState<MediaDeviceInfo[] | null>(null);
    const [camera, setCamera] = useState<MediaStream | null>(null);

    const handleEnableMediaAccess = async () => {
        const streams = await navigator.mediaDevices.getUserMedia( {video: true, audio: true} );
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        setDevices(deviceList);
        streams.getTracks().forEach( track => { track.stop(); } );
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
        <>
            {!devices && 
                <div onClick={handleEnableMediaAccess} className='flex flex-col items-center cursor-pointer'>
                    <BiCamera className="mb-2" /> 
                    <div>Enable Webcam</div>
                </div> 
            }
            {devices &&
                <div className='flex flex-col items-center cursor-pointer'>
                    <BiCamera className="mb-2" /> 
                    <select name="camera" onChange={handleSelectedCamera} className="rounded-lg p-2 backdrop-blur-sm bg-white/50">
                        {devices?.filter( device => (device.deviceId !== '') && (device.kind === 'videoinput'))
                            .map( device => <option key={`${device.groupId}-${device.deviceId}`} value={device.deviceId}>{device.label}</option>)}
                    </select>
                </div>
            }
        </>
    );
}

export default WebcamSettings;