import HorizontalBreak from "../components/HorizontalBreak";
import Horizontal from "../components/HorizontalBreak";
import PageLabel from "../components/PageLabel";
import PageLabel2 from "../components/PageLabel2";
import { useState, useRef } from "react"

export default function Report() {
  const [image, setImage] = useState(null);
  const fileInputRef = useRef(null);
  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };

  const openFilePicker = () => {
    fileInputRef.current.click();
  };
  return (
    <>
      <PageLabel label="Lost Item Report Form" />
      <div className="bg-(--color-secondary)  h-fit px-4">
        <PageLabel2 label="Item Description" />
        <HorizontalBreak />
        <div className="bg-white w-full h-fit p-2 rounded-xl mt-4 mb-2 flex items-center justify-center flex-col">
          {image ? (
            <img
              src={image}
              alt="Uploaded"
              onClick={openFilePicker}
              className="w-full max-h-50 object-cover rounded-xl cursor-pointer hover:opacity-80 transition"
            />
          ) : (
            <div className="p-1 border border-dashed rounded-full border-(--color-primary)">
              <label onClick={openFilePicker} className="btn-circle btn-lg bg-(--color-primary) cursor-pointer flex items-center justify-center">
                <i className="fa-solid fa-plus text-white"></i>
              </label>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleChange}
          />
          {!image && (
            <>
              <p className="text-sm text-(--color-tertiary) opacity-70 font-medium mt-2">
                Upload Item Photo (Optional)
              </p>

              <p className="text-xs text-center text-(--color-tertiary) opacity-70 font-medium mt-4 px-6">
                *FoundNest AI will help auto-fill details based on your photo.
              </p>
            </>
          )}
        </div>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Category*</legend>
          <select placeholder="Select Category" className="select bg-white rounded-md text-xs w-full">
            <option disabled={true}>Select Category</option>
            <option>Academic Materials</option>
            <option>Clothing and Accessories</option>
            <option>Electronics</option>
          </select>
        </fieldset>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Item Name*</legend>
          <input type="text" className="input bg-white rounded-md text-xs w-full" placeholder="e.g., iPhone 13 Pro Max, Bag, Umbrella" />
        </fieldset>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Detailed Description*</legend>
          <textarea className="textarea h-20 bg-white rounded-md text-xs w-full" placeholder="Brand, Model, Size, Color, Material, etc."></textarea>
        </fieldset>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Contents (if applicable)</legend>
          <input type="text" className="input bg-white rounded-md text-xs w-full" placeholder="e.g., Cash amount, ID name" />
        </fieldset>
        <HorizontalBreak />
        <div className="pb-16"></div>
      </div>
    </>
  );
}