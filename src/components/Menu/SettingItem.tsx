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

type DropDownSettingItem = {
    displayName: string
    type: "DROPDOWN"
    value: string
    options: string[]
    setValue: React.Dispatch<React.SetStateAction<string>> | ( ( _: any ) => void)
}

type SettingItem = FloatSettingItem | Vec2SettingItem | Vec3SettingItem | ToggleSettingItem | DropDownSettingItem;

function isFloat(item: SettingItem ): item is FloatSettingItem {
    return (item as FloatSettingItem).type === "FLOAT";
}

function isVec2(item: SettingItem ): item is Vec2SettingItem {
    return (item as Vec2SettingItem).type === "VEC2";
}

function isVec3(item: SettingItem ): item is Vec3SettingItem {
    return (item as Vec3SettingItem).type === "VEC3";
}

function isToggle(item: SettingItem ): item is ToggleSettingItem {
    return (item as ToggleSettingItem).type === "TOGGLE";
}

function isDropDown(item: SettingItem ): item is DropDownSettingItem {
    return (item as DropDownSettingItem).type === "DROPDOWN";
}

const SettingItem = (item: SettingItem) => {
    return (
        <div className='h-full m-auto md:text-xl flex flex-col items-center justify-evenly sm:text-sm'>
            <div className='w-40 md:w-48 uppercase font-extralight text-center'>{item.displayName}</div>
                <div>          
                    {isFloat(item) &&
                        <input 
                        className='bg-transparent font-mono text-center'
                        type="number" 
                        min={item.min} 
                        max={item.max}
                        step={item.step || 1}
                        value={item.value}
                        onChange={e => item.setValue(e.target.valueAsNumber)}
                        />
                    }
                    {isDropDown(item) &&
                        <select 
                            value={item.value}
                            onChange={e => item.setValue(e.target.value)}
                        >
                            {item.options.map( (op, i) => <option key={i} value={op}>{op}</option> )}
                        </select>
                    }
                    {isToggle(item) &&
                        <div>{ item.value ? 'Enabled' : 'Disabled' }</div>
                    }
                </div>
            <div >
                {isFloat(item) &&
                    <input 
                        className='w-full bg-white/30 accent-white rounded-lg appearance-none cursor-pointer'
                        type="range" 
                        min={item.min} 
                        max={item.max}
                        step={item.step || 1}
                        value={item.value}
                        onChange={e => item.setValue(e.target.valueAsNumber)}
                    />
                }
                {isToggle(item) &&
                    <input 
                        className='w-5 h-5 bg-white/30 accent-zinc-400 text-black rounded-full cursor-pointer'
                        type="checkbox" 
                        checked={item.value}
                        onChange={ () => item.setValue(!item.value)}
                    />
                }
            </div>
        </div>
    );
}

export default SettingItem;