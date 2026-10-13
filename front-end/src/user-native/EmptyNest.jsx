import emptyNestBg from "../assets/native/empty-nest-bg.png";
import emptyNest from "../assets/native/empty-nest.png";
import upperLeft from "../assets/native/upper-left.png";
import upperRight from "../assets/native/upper-right.png";
import upperRightBee from "../assets/native/upper-right-bee.png";

// Empty-state illustration (EmptyNestIllustration in the native Report History screen)
export default function EmptyNest() {
  return (
    <div className="relative w-[280px] h-[240px] flex items-center justify-center">
      <img src={emptyNestBg} alt="" className="absolute w-[280px] h-[240px] object-contain" />
      <img src={upperLeft} alt="" className="absolute w-[55px] h-[55px] object-contain left-[55px] top-[55px]" />
      <img src={upperRight} alt="" className="absolute w-[55px] h-[55px] object-contain right-[60px] top-[35px]" />
      <img src={upperRightBee} alt="" className="absolute w-5 h-5 object-contain right-[42px] top-[25px]" />
      <img src={emptyNest} alt="" className="absolute w-[170px] h-[90px] object-contain bottom-[45px]" />
    </div>
  );
}
