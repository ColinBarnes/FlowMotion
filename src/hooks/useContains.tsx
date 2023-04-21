import { useThree } from "@react-three/fiber";
import { useMemo } from "react";

/*
    Similar to Drei's useAspect, but calculates similar to CSS 'contain' instead of 'cover'
*/

function useContain(width: number, height: number, factor: number = 1): [number, number, number] {
    const container = useThree( (state) => state.viewport);
    
    return useMemo( () => {
        if( width === 0 || height === 0) {
            return [1,1,1];
        }
        console.log('screen resolution', container.width, container.height);
        console.log('video resolution', width, height);
        //const scale = Math.min( screen.width/width, screen.height/height );
        const videoAspectRatio = width/height;
        const containerAspectRatio = container.width/container.height;

        let scale = 1;
        if( videoAspectRatio > containerAspectRatio ) {
            scale = container.width/width;
        } else {
            scale = container.height/height;
        }

        return [scale * width * factor, scale * height * factor, 1];
    }, [container.width, container.height, width, height, factor]);
}

export default useContain;