// From: https://blog.logrocket.com/responsive-camera-component-react-hooks/
import { useEffect, useState } from "react";

const useUserMedia = ( constraints: MediaStreamConstraints ) => {
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

    useEffect( () => {
        async function enableStream() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia( constraints );
                setMediaStream( stream );
            } catch ( err ) {
                console.warn(err);
            }
        }

        if( !mediaStream ) {
            enableStream();
        } else {
            return () => {
                mediaStream.getTracks().forEach( track => { track.stop(); } );
            }
        }
    }, [mediaStream, constraints]);

    return mediaStream;
}

export default useUserMedia;