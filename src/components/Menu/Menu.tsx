type Props = {
    children?: React.ReactNode
}

function Menu({children}: Props) {
    return (
        <div className='transition-opacity duration-500 md:opacity-0 hover:opacity-100 col-start-1 col-span-full row-start-6 row-span-1 z-10 flex flex-row justify-evenly items-center overflow-x-auto'>
            {children}
        </div>
    )
}

export default Menu;