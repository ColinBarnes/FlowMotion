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
        const scale = Math.min( screen.width/width, screen.height/height );
        return [scale * width * factor, scale * height * factor, 1];
    }, [screen.width, screen.height, width, height, factor]);
}

export default useContain;