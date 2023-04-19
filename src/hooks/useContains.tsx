import { useThree } from "@react-three/fiber";
import { useMemo } from "react";

/*
    Similar to Drei's useAspect, but calculates similar to CSS 'contain' instead of 'cover'
*/

function useContain(width: number, height: number, factor: number = 1): [number, number, number] {
    const screen = useThree( (state) => state.viewport);
    
    return useMemo( () => {
        if( width === 0 || height === 0) {
            return [1,1,1];
        }
        const videoAspect = width/height;
        const screenIsLandscape = screen.aspect > 1;
        const videoIsLandscape = videoAspect > 1;
        let scale;
        if( screenIsLandscape !== videoIsLandscape ) {
            scale = ( videoIsLandscape ) ? screen.width/width : screen.height/height;
        } else {
            if( screenIsLandscape ) {
                scale = ( screen.aspect < videoAspect ) ? screen.width/width : screen.height/height;
            } else {
                scale = ( screen.aspect < videoAspect ) ? screen.height/height : screen.width/width;
            }
            
        }
        return [scale * width * factor, scale * height * factor, 1];
    }, [screen.width, screen.height, screen.aspect, width, height, factor]);
}

export default useContain;