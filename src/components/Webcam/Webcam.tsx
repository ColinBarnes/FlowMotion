import { useEffect } from "react";

type Props = {
    stream: MediaStream | null
    videoRef: React.MutableRefObject<HTMLVideoElement | null>
}
const display = false;
const Webcam = ({ stream, videoRef }: Props) => {
    useEffect(() => {
        if (stream && videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, [stream, videoRef]);
    return (
        <>
        {stream &&
            <video ref={videoRef} autoPlay playsInline muted className={'invisible'} />
        }
        </>
        
    )
}

export default Webcam;