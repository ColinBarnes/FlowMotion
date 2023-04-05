import { Vector2, Vector3 } from "@react-three/fiber";

type SettingTypes = 'FLOAT' | 'VEC2' | 'VEC3' | 'TOGGLE';

type FloatSettingItem = {
    displayName: string
    type: "FLOAT"
    value: number
    setValue: React.Dispatch<number>
    min: number
    max: number
    step?: number
}

type Vec2SettingItem = {
    displayName: string
    type: "VEC2"
    value: Vector2
    setValue: React.Dispatch<React.SetStateAction<Vector2>>
}

type Vec3SettingItem = {
    displayName: string
    type: "VEC3"
    value: Vector3
    setValue: React.Dispatch<React.SetStateAction<Vector3>>
}

type ToggleSettingItem = {
    displayName: string
    type: "TOGGLE"
    value: boolean
    setValue: React.Dispatch<React.SetStateAction<boolean>>
}

type Props = FloatSettingItem | Vec2SettingItem | Vec3SettingItem | ToggleSettingItem;

const SettingItem = ({displayName, type, min, max, value, step, setValue}: Props) => {
    return (
        <div className='h-full m-auto md:text-xl flex flex-col items-center justify-evenly sm:text-sm'>
            <div className='w-40 md:w-48 uppercase font-extralight text-center'>{displayName}</div>
                <div>          
                    {type === "FLOAT" &&
                        <input 
                        className='bg-transparent font-mono text-center'
                        type="number" 
                        min={min} 
                        max={max}
                        step={step || 1}
                        value={value}
                        onChange={e => setValue(e.target.valueAsNumber)}
                        />
                    }
                    {type === "TOGGLE" &&
                        <div>{ value ? 'Enabled' : 'Disabled' }</div>
                    }
                </div>
            <div >
                {type === "FLOAT" &&
                    <input 
                        className='w-full bg-white/30 accent-white rounded-lg appearance-none cursor-pointer'
                        type="range" 
                        min={min} 
                        max={max}
                        step={step || 1}
                        value={value}
                        onChange={e => setValue(e.target.valueAsNumber)}
                    />
                }
                {type === "TOGGLE" &&
                    <input 
                        className='w-5 h-5 bg-white/30 accent-zinc-400 text-black rounded-full cursor-pointer'
                        type="checkbox" 
                        checked={value}
                        onChange={ () => setValue(!value)}
                    />
                }
            </div>
        </div>
    );
}

export default SettingItem;