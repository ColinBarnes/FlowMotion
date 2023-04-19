import { useState } from "react";
import { BiMicrophone, BiMicrophoneOff } from "react-icons/bi"

type Props = {
    onAudioStream?: (stream: MediaStream) => any,
}

const MicrophoneSettings = ({ onAudioStream }: Props) => {
    const [devices, setDevices] = useState<MediaDeviceInfo[] | null>(null);
    const [microphone, setMicrophone] = useState<MediaStream | null>(null);

    const handleEnableMediaAccess = async () => {
        const deviceList = await (await navigator.mediaDevices.enumerateDevices()).filter(dev => dev.kind === 'audioinput');
        setDevices(deviceList);
        if( onAudioStream ) {
            const micStream = await navigator.mediaDevices.getUserMedia( {
                audio: {
                    deviceId: {
                        exact: deviceList[0].deviceId
                    }
                }
            } );
            onAudioStream( micStream );
            setMicrophone( micStream );
        }
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

    return (
        <>
        {!devices && 
            <div onClick={handleEnableMediaAccess} className='flex flex-col items-center cursor-pointer'>
                <BiMicrophone className="mb-2" /> 
                <div>Enable Microphone</div>
            </div> 
        }
        {devices &&
            <div className='flex flex-col items-center cursor-pointer'>
                <BiMicrophone className="mb-2" />
                <select name="microphone" onChange={handleSelectedMicrophone} className="rounded-lg p-2 backdrop-blur-sm bg-white/25">
                    {devices?.filter( device => device.deviceId !== '' )
                        .map( device => <option hidden={false} key={`${device.groupId}-${device.deviceId}`} value={device.deviceId}>{device.label}</option>)}
                </select> 
            </div>                
        }
        </>
    );
}

export default MicrophoneSettings;