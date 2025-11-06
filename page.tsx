'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Play, Pause, Globe, Download, Upload, Clock, History, Settings, Cog } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

interface SpeedTestResult {
  id: string
  download: number
  upload: number
  ping: number
  server: string
  timestamp: Date
}

interface Server {
  id: string
  name: string
  location: string
  country: string
}

export default function Home() {
  const [isRunning, setIsRunning] = useState(false)
  const [currentSpeed, setCurrentSpeed] = useState(0)
  const [downloadSpeed, setDownloadSpeed] = useState(0)
  const [uploadSpeed, setUploadSpeed] = useState(0)
  const [ping, setPing] = useState(0)
  const [progress, setProgress] = useState(0)
  const [selectedServer, setSelectedServer] = useState('1')
  const [testHistory, setTestHistory] = useState<SpeedTestResult[]>([])
  const [currentPhase, setCurrentPhase] = useState<'idle' | 'ping' | 'download' | 'upload' | 'complete'>('idle')
  const [connectionInfo, setConnectionInfo] = useState({
    isp: '',
    ip: '',
    location: ''
  })
  const [servers, setServers] = useState<Server[]>([
    { id: '1', name: 'SpeedTest Server 1', location: 'Jakarta', country: 'Indonesia' },
    { id: '2', name: 'SpeedTest Server 2', location: 'Singapore', country: 'Singapore' },
    { id: '3', name: 'SpeedTest Server 3', location: 'Tokyo', country: 'Japan' },
    { id: '4', name: 'SpeedTest Server 4', location: 'Hong Kong', country: 'Hong Kong' },
    { id: '5', name: 'SpeedTest Server 5', location: 'Sydney', country: 'Australia' },
  ])
  const [settings, setSettings] = useState({
    downloadSize: 10, // MB
    uploadSize: 1, // MB
    autoStart: false,
    showAdvanced: false,
    parallelConnections: 3
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const savedHistory = localStorage.getItem('speedTestHistory')
    if (savedHistory) {
      setTestHistory(JSON.parse(savedHistory))
    }
    
    getConnectionInfo()
    fetchServers()
  }, [])

  const fetchServers = async () => {
    try {
      const response = await fetch('/api/servers')
      const data = await response.json()
      if (data.success) {
        setServers(data.servers)
      }
    } catch (error) {
      console.error('Failed to fetch servers:', error)
    }
  }

  const getConnectionInfo = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/')
      const data = await response.json()
      setConnectionInfo({
        isp: data.org || 'Unknown ISP',
        ip: data.ip || 'Unknown IP',
        location: `${data.city}, ${data.country_name}` || 'Unknown Location'
      })
    } catch (error) {
      console.error('Failed to get connection info:', error)
    }
  }

  const runSpeedTest = async () => {
    setIsRunning(true)
    setProgress(0)
    setCurrentPhase('ping')
    
    try {
      // Ping test
      const pingStartTime = Date.now()
      const pingResponse = await fetch(`/api/speed/ping?t=${pingStartTime}`)
      const pingData = await pingResponse.json()
      const pingResult = Date.now() - pingStartTime
      setPing(pingResult)
      setProgress(25)
      
      // Download test
      setCurrentPhase('download')
      const downloadStartTime = Date.now()
      const downloadResponse = await fetch(`/api/speed/download?size=${settings.downloadSize * 1048576}`) // Convert MB to bytes
      const downloadBlob = await downloadResponse.arrayBuffer()
      const downloadEndTime = Date.now()
      const downloadTimeSeconds = (downloadEndTime - downloadStartTime) / 1000
      const downloadBits = downloadBlob.byteLength * 8
      const downloadSpeedMbps = (downloadBits / downloadTimeSeconds) / 1000000
      
      setDownloadSpeed(downloadSpeedMbps)
      setCurrentSpeed(downloadSpeedMbps)
      setProgress(50)
      
      // Upload test
      setCurrentPhase('upload')
      const uploadData = new ArrayBuffer(settings.uploadSize * 1048576) // Convert MB to bytes
      const uploadStartTime = Date.now()
      const uploadResponse = await fetch('/api/speed/upload', {
        method: 'POST',
        body: uploadData,
        headers: {
          'Content-Type': 'application/octet-stream'
        }
      })
      const uploadEndTime = Date.now()
      const uploadTimeSeconds = (uploadEndTime - uploadStartTime) / 1000
      const uploadBits = uploadData.byteLength * 8
      const uploadSpeedMbps = (uploadBits / uploadTimeSeconds) / 1000000
      
      setUploadSpeed(uploadSpeedMbps)
      setCurrentSpeed(uploadSpeedMbps)
      setProgress(100)
      setCurrentPhase('complete')
      
      // Save result to history
      const result: SpeedTestResult = {
        id: Date.now().toString(),
        download: downloadSpeedMbps,
        upload: uploadSpeedMbps,
        ping: pingResult,
        server: servers.find(s => s.id === selectedServer)?.name || 'Unknown Server',
        timestamp: new Date()
      }
      
      const newHistory = [result, ...testHistory].slice(0, 10)
      setTestHistory(newHistory)
      localStorage.setItem('speedTestHistory', JSON.stringify(newHistory))
      
      setTimeout(() => {
        setIsRunning(false)
        setCurrentPhase('idle')
        setCurrentSpeed(0)
        toast({
          title: "Speed Test Complete",
          description: `Download: ${downloadSpeedMbps.toFixed(1)} Mbps, Upload: ${uploadSpeedMbps.toFixed(1)} Mbps, Ping: ${pingResult} ms`,
        })
      }, 1000)
      
    } catch (error) {
      console.error('Speed test failed:', error)
      setIsRunning(false)
      setCurrentPhase('idle')
      setCurrentSpeed(0)
      setProgress(0)
      toast({
        title: "Speed Test Failed",
        description: "An error occurred during the speed test. Please try again.",
        variant: "destructive"
      })
    }
  }

  const stopSpeedTest = () => {
    setIsRunning(false)
    setCurrentPhase('idle')
    setCurrentSpeed(0)
    setProgress(0)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }

  const getSpeedColor = (speed: number) => {
    if (speed < 10) return 'text-red-500'
    if (speed < 30) return 'text-yellow-500'
    if (speed < 60) return 'text-blue-500'
    return 'text-green-500'
  }

  const getPhaseText = () => {
    switch (currentPhase) {
      case 'ping': return 'Testing Ping...'
      case 'download': return 'Testing Download...'
      case 'upload': return 'Testing Upload...'
      case 'complete': return 'Test Complete!'
      default: return 'Ready to Test'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Speed Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test your internet connection speed
          </p>
        </div>

        {/* Connection Info */}
        <Card className="mb-8">
          <CardContent className="p-4">
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span className="font-medium">IP:</span>
                <span>{connectionInfo.ip}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">ISP:</span>
                <span>{connectionInfo.isp}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Location:</span>
                <span>{connectionInfo.location}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Speed Test */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Speed Meter */}
          <div className="lg:col-span-2">
            <Card className="relative overflow-hidden">
              <CardContent className="p-8">
                <div className="flex flex-col items-center">
                  {/* Circular Speed Meter */}
                  <div className="relative w-64 h-64 mb-8">
                    <div className="absolute inset-0 rounded-full border-8 border-gray-200 dark:border-gray-700"></div>
                    <div className="absolute inset-0 rounded-full border-8 border-blue-500 border-t-transparent border-r-transparent transform rotate-45 transition-transform duration-1000 ease-out"
                         style={{ transform: `rotate(${45 + (progress * 2.7)}deg)` }}></div>
                    <div className="absolute inset-4 rounded-full bg-white dark:bg-gray-800 flex flex-col items-center justify-center">
                      <div className={`text-5xl font-bold ${getSpeedColor(currentSpeed)}`}>
                        {currentSpeed.toFixed(1)}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 text-sm">
                        Mbps
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        {getPhaseText()}
                      </div>
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div className="flex gap-4 mb-6">
                    <Button
                      onClick={isRunning ? stopSpeedTest : runSpeedTest}
                      disabled={isRunning}
                      size="lg"
                      className="px-8"
                    >
                      {isRunning ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          Stop Test
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Start Test
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Progress Bar */}
                  {isRunning && (
                    <div className="w-full max-w-md">
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}

                  {/* Speed Results */}
                  <div className="grid grid-cols-3 gap-8 mt-8 w-full max-w-md">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Download className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {downloadSpeed.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-500">Download Mbps</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Upload className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {uploadSpeed.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-500">Upload Mbps</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Clock className="w-5 h-5 text-yellow-500" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {ping}
                      </div>
                      <div className="text-sm text-gray-500">Ping ms</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Server Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Test Server
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedServer} onValueChange={setSelectedServer} disabled={isRunning}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select server" />
                  </SelectTrigger>
                  <SelectContent>
                    {servers.map(server => (
                      <SelectItem key={server.id} value={server.id}>
                        <div>
                          <div className="font-medium">{server.name}</div>
                          <div className="text-sm text-gray-500">{server.location}, {server.country}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Connection Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Download</span>
                      <span className={`text-sm font-medium ${getSpeedColor(downloadSpeed)}`}>
                        {downloadSpeed > 0 ? `${downloadSpeed.toFixed(1)} Mbps` : 'N/A'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(downloadSpeed, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Upload</span>
                      <span className={`text-sm font-medium ${getSpeedColor(uploadSpeed)}`}>
                        {uploadSpeed > 0 ? `${uploadSpeed.toFixed(1)} Mbps` : 'N/A'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(uploadSpeed, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Ping</span>
                      <span className={`text-sm font-medium ${ping < 50 ? 'text-green-500' : ping < 100 ? 'text-yellow-500' : 'text-red-500'}`}>
                        {ping > 0 ? `${ping} ms` : 'N/A'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(0, 100 - ping)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Recent Tests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {testHistory.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No test history yet
                    </p>
                  ) : (
                    testHistory.map(result => (
                      <div key={result.id.toString()} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm font-medium">
                            {new Date(result.timestamp).toLocaleString()}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {result.server}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <Download className="w-3 h-3 inline mr-1 text-blue-500" />
                            {result.download.toFixed(1)} Mbps
                          </div>
                          <div>
                            <Upload className="w-3 h-3 inline mr-1 text-green-500" />
                            {result.upload.toFixed(1)} Mbps
                          </div>
                          <div>
                            <Clock className="w-3 h-3 inline mr-1 text-yellow-500" />
                            {result.ping} ms
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Cog className="w-4 h-4 mr-2" />
                      Configure Test
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Speed Test Settings</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="download-size" className="text-right">
                          Download Size (MB)
                        </Label>
                        <Input
                          id="download-size"
                          type="number"
                          min="1"
                          max="100"
                          value={settings.downloadSize}
                          onChange={(e) => setSettings(prev => ({ ...prev, downloadSize: parseInt(e.target.value) || 10 }))}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="upload-size" className="text-right">
                          Upload Size (MB)
                        </Label>
                        <Input
                          id="upload-size"
                          type="number"
                          min="1"
                          max="50"
                          value={settings.uploadSize}
                          onChange={(e) => setSettings(prev => ({ ...prev, uploadSize: parseInt(e.target.value) || 1 }))}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="parallel" className="text-right">
                          Parallel Connections
                        </Label>
                        <Input
                          id="parallel"
                          type="number"
                          min="1"
                          max="10"
                          value={settings.parallelConnections}
                          onChange={(e) => setSettings(prev => ({ ...prev, parallelConnections: parseInt(e.target.value) || 3 }))}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="auto-start" className="text-right">
                          Auto Start
                        </Label>
                        <div className="col-span-3">
                          <Switch
                            id="auto-start"
                            checked={settings.autoStart}
                            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoStart: checked }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="advanced" className="text-right">
                          Advanced Mode
                        </Label>
                        <div className="col-span-3">
                          <Switch
                            id="advanced"
                            checked={settings.showAdvanced}
                            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showAdvanced: checked }))}
                          />
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )

}
