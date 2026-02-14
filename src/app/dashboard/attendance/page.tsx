"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";

interface AttendanceRecord {
  id: string;
  datetime: string;
  status: string;
  lat: number;
  lng: number;
  distanceToOffice: number | null;
  staff?: {
    user: {
      name: string | null;
      email: string | null;
    };
  };
}

export default function AttendancePage() {
  const { data: session, status } = useSession();
  const [role, setRole] = useState<string>("");
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");

  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/";
    }
    if (status === "authenticated") {
      const user = session?.user as any;
      setRole(user?.role || "");
      fetchAttendances();
    }
  }, [status, session]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const fetchAttendances = async () => {
    try {
      const res = await fetch("/api/attendance");
      const data = await res.json();
      setAttendances(data.attendances || []);

      const today = new Date().toDateString();
      const todayRecord = (data.attendances || []).find(
        (a: AttendanceRecord) => new Date(a.datetime).toDateString() === today
      );
      setTodayAttendance(todayRecord || null);
    } catch {
      setError("Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    setError("");
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      setStream(mediaStream);
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch {
      setError("Unable to access camera. Please allow camera permissions.");
    }
  };

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      setSelfie(dataUrl);
      stopCamera();
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  }, [stream]);

  const retakeSelfie = () => {
    setSelfie(null);
    startCamera();
  };

  const getLocation = () => {
    setGpsLoading(true);
    setGpsError("");
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser");
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setAccuracy(position.coords.accuracy);
        setGpsLoading(false);
      },
      (err) => {
        setGpsError(`GPS error: ${err.message}`);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = async () => {
    if (!selfie) {
      setError("Please capture a selfie first");
      return;
    }
    if (lat === null || lng === null) {
      setError("Please get your GPS location first");
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selfie, lat, lng }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit attendance");
      } else {
        setSuccess("Attendance recorded successfully!");
        setSelfie(null);
        setLat(null);
        setLng(null);
        setAccuracy(null);
        fetchAttendances();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3">
              <img src="/ykvm-logo.png" alt="YKVM" className="h-10 w-auto" />
              <h1 className="text-xl font-bold text-gray-900">YKVM Staff MIS</h1>
            </div>
            <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-800">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-8 px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Attendance</h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            {success}
          </div>
        )}

        {role === "STAFF" ? (
          <div className="space-y-6">
            {todayAttendance && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-green-800 mb-1">Today&apos;s Attendance</h3>
                <p className="text-sm text-green-700">
                  Status: <span className="font-medium">{todayAttendance.status}</span> &mdash;{" "}
                  {new Date(todayAttendance.datetime).toLocaleTimeString()}
                </p>
              </div>
            )}

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Capture Selfie</h3>
              <canvas ref={canvasRef} className="hidden" />

              {!selfie && !cameraActive && (
                <button
                  onClick={startCamera}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Open Camera
                </button>
              )}

              {cameraActive && (
                <div className="space-y-3">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full max-w-md rounded-lg border border-gray-200"
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={captureSelfie}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Capture
                    </button>
                    <button
                      onClick={stopCamera}
                      className="px-4 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {selfie && (
                <div className="space-y-3">
                  <img src={selfie} alt="Captured selfie" className="w-full max-w-md rounded-lg border border-gray-200" />
                  <button
                    onClick={retakeSelfie}
                    className="px-4 py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition-colors"
                  >
                    Retake
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">GPS Location</h3>
              {lat !== null && lng !== null ? (
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Latitude:</span> {lat.toFixed(6)}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Longitude:</span> {lng.toFixed(6)}
                  </p>
                  {accuracy !== null && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Accuracy:</span> {accuracy.toFixed(1)} meters
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-4">Location not captured yet.</p>
              )}
              {gpsError && (
                <p className="text-sm text-red-600 mb-3">{gpsError}</p>
              )}
              <button
                onClick={getLocation}
                disabled={gpsLoading}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {gpsLoading ? "Getting Location..." : lat !== null ? "Refresh Location" : "Get Location"}
              </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <button
                onClick={handleSubmit}
                disabled={submitting || !selfie || lat === null}
                className="w-full px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? "Submitting..." : "Submit Attendance"}
              </button>
            </div>

            {attendances.length > 0 && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50">
                  <h3 className="text-sm font-medium text-gray-700">Recent Attendance</h3>
                </div>
                <ul className="divide-y divide-gray-200">
                  {attendances.slice(0, 10).map((a) => (
                    <li key={a.id} className="px-6 py-3 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(a.datetime).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(a.datetime).toLocaleTimeString()}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          a.status === "PRESENT"
                            ? "bg-green-100 text-green-800"
                            : a.status === "LATE"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {a.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h3 className="text-sm font-medium text-gray-700">
                All Attendance Records ({attendances.length})
              </h3>
            </div>
            {attendances.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                No attendance records found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Staff
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date &amp; Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Distance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendances.map((a) => (
                      <tr key={a.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {a.staff?.user?.name || a.staff?.user?.email || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(a.datetime).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              a.status === "PRESENT"
                                ? "bg-green-100 text-green-800"
                                : a.status === "LATE"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {a.distanceToOffice !== null ? `${a.distanceToOffice.toFixed(1)}m` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
