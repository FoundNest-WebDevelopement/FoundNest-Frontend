import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const BULSU_CENTER = { lat: 14.8574, lng: 120.8146 };

// Loose bounding box around the BulSU main campus — generous enough to cover
// every hall/gate, but tight enough to stop pins from being dropped off-campus.
const BULSU_BOUNDS = [
    [14.8535, 120.8105], // SW corner
    [14.8615, 120.8185], // NE corner
];

const clampToBounds = (lat, lng) => {
    const [[swLat, swLng], [neLat, neLng]] = BULSU_BOUNDS;
    return [
        Math.min(Math.max(lat, swLat), neLat),
        Math.min(Math.max(lng, swLng), neLng),
    ];
};

const activeMarkerIcon = (label) =>
    new L.DivIcon({
        className: "",
        html: `
        <div style="position:absolute; transform:translate(-50%, -100%); display:flex; flex-direction:column; align-items:center;">
          <div style="background:#990000; color:white; font-size:10px; font-weight:600; padding:3px 8px; border-radius:20px; white-space:nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
            ${label || "New Center"}
          </div>
          <div style="width:0; height:0; border-left:8px solid transparent; border-right:8px solid transparent; border-top:10px solid #990000; margin-top:-1px;"></div>
        </div>
      `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
    });

const referenceMarkerIcon = (label) =>
    new L.DivIcon({
        className: "",
        html: `
        <div style="position:absolute; transform:translate(-50%, -100%); display:flex; flex-direction:column; align-items:center; opacity:0.55;">
          <div style="background:#8C7B6B; color:white; font-size:9px; font-weight:500; padding:2px 6px; border-radius:20px; white-space:nowrap; box-shadow: 0 1px 4px rgba(0,0,0,0.25);">
            ${label}
          </div>
          <div style="width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:8px solid #8C7B6B; margin-top:-1px;"></div>
        </div>
      `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
    });

function MapClickHandler({ onPick }) {
    useMapEvents({
        click: (e) => {
            const [lat, lng] = clampToBounds(e.latlng.lat, e.latlng.lng);
            onPick(lat, lng);
        },
    });
    return null;
}

export default function CampusMapPicker({
    latitude,
    longitude,
    onChange,
    referenceCenters = [],
    markerLabel = "",
}) {
    const hasPosition = latitude != null && longitude != null;

    const [mapCenter] = useState(
        hasPosition ? [latitude, longitude] : [BULSU_CENTER.lat, BULSU_CENTER.lng]
    );

    return (
        <div className="w-full h-64 rounded-lg overflow-hidden border border-[#DDD9CF]">
            <MapContainer
                center={mapCenter}
                zoom={17}
                className="h-full w-full z-0"
                zoomControl={true}
                maxBounds={BULSU_BOUNDS}
                maxBoundsViscosity={1.0}
            >
                <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution="Tiles © Esri"
                />

                <MapClickHandler onPick={(lat, lng) => onChange(lat, lng)} />

                {referenceCenters.map((center) => (
                    <Marker
                        key={center.office_id}
                        position={[center.latitude, center.longitude]}
                        icon={referenceMarkerIcon(center.office_name)}
                        interactive={false}
                    />
                ))}

                {hasPosition && (
                    <Marker
                        position={[latitude, longitude]}
                        icon={activeMarkerIcon(markerLabel)}
                        draggable={true}
                        eventHandlers={{
                            dragend: (e) => {
                                const { lat, lng } = e.target.getLatLng();
                                const [clampedLat, clampedLng] = clampToBounds(lat, lng);
                                onChange(clampedLat, clampedLng);
                            },
                        }}
                    />
                )}
            </MapContainer>
        </div>
    );
}