type Props = {
    label: string,
    onClick: React.MouseEventHandler<HTMLDivElement>,
    children?: React.ReactNode
}

function MenuItem({label, onClick, children}: Props) {
    return (
    <div onClick={ onClick } className='flex flex-col items-center cursor-pointer' >
        {children}
        <div>{label}</div>
    </div>
    )
}

export default MenuItem;