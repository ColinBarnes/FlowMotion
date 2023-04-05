import { useEffect, useState } from "react";

const useEnumerateDevices = () => {
    const [devices, setDevices] = useState<MediaDeviceInfo[] | null>(null);

    useEffect( () => {
        async function getDevices() {
            try {
                const deviceList = await navigator.mediaDevices.enumerateDevices();
                console.log('deviceList', deviceList);
                setDevices( deviceList );
            } catch ( err ) {
                console.warn(err);
            }
        }

        if( !devices ) {
            getDevices();
        }
    }, [devices]);

    return devices;
}

export default useEnumerateDevices;