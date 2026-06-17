import icon from "../assets/lfms_icon.png"
import { NavLink } from "react-router-dom";
import { Bell } from "lucide-react";
import { useState } from "react";

export default function AdminTopBar({tabName}) {
    const fullName = localStorage.getItem("first_name") + " " + localStorage.getItem("last_name");
    return (
        <>
            <div className="h-full w-full bg-white flex">
                <div className="h-full w-60 bg-primary ">
                    <div className="h-full w-full flex items-center justify-start px-4 gap-2 ">
                        <div className="bg-(--color-quaternary) w-fit h-fit p-1 rounded-md ">
                            <img src={icon} alt="LFMS Icon" className="h-8" />
                        </div>
                        <div className="flex flex-col">
                            <p className="text-md font-bold text-(--color-quaternary)">FoundNest</p>
                            <p className="text-xs text-white ">{localStorage.getItem("office_name") || "Office Admin"}</p>
                        </div>
                    </div>
                    <hr className="border border-white/12 opacity-30" />
                </div>
                <div className="h-full flex-1 shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)] flex items-center justify-between p-4">
                    <div className="font-semibold text-xl">
                        <p>{tabName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <NavLink
                            to="/notifications"
                            className={({ isActive }) =>
                                isActive
                                    ? "text-(--color-primary)"
                                    : "text-(--color-primary)"
                            }
                        >

                            {({ isActive }) =>
                                isActive ? (
                                    <Bell className="size-6 fill-current" />
                                ) :
                                    <Bell className="size-6" />
                            }
                        </NavLink>
                        <div className="flex items-center justify-center p-2 rounded-xl gap-2 border-3 border-[#F9ECEC] bg-[#F9ECEC]/30">
                            <i className="fa-regular fa-circle-user text-[#1A1208] text-2xl"></i>
                            <p className="text-sm text-[#1A1208]">{fullName}</p>
                        </div>
                    </div>
                </div>

            </div>
        </>
    )
}