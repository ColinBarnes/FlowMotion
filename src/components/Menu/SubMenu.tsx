type Props = {
    visible?: boolean,
    children?: React.ReactNode
}

function SubMenu({visible=false, children}: Props) {
    return (
        <>
        {visible && <div className='px-10 w-full flex flex-row gap-32 col-start-1 col-span-full row-start-5 row-span-1 z-10 backdrop-blur-lg bg-white/10 overflow-x-auto'>
            {children}
        </div>}
        </>
    )
}

export default SubMenu;