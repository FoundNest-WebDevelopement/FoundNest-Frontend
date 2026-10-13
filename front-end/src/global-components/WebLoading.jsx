export default function WebLoading ({marginBottom = "mb-40"}) {
    return (
        <>
            <div className="w-full h-screen  flex flex-col items-center justify-center gap-4">
                                <div 
                                    className="h-10 w-10 animate-spin rounded-full border-t-2 border-l-2 border-transparent border-"
                                    style={{ borderWidth: '5px', borderTopColor: '#DDD9CF', borderLeftColor: '#DDD9CF', borderRightColor: '#DDD9CF'  }}
                                ></div>
                                <p className={`  ${marginBottom} text-[#DDD9CF] font-medium tracking-wide text-xs`}>Loading...</p>
                                </div>
        </>
    )
}