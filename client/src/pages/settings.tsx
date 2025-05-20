import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("general");
  
  return (
    <AppLayout title="Settings">
      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Update your organization details and settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input id="company-name" defaultValue="Coditas Technologies" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" defaultValue="https://www.coditas.com" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Contact Email</Label>
                  <Input id="contact-email" defaultValue="info@coditas.com" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" defaultValue="+91 12345 67890" />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" defaultValue="123 Tech Park, Innovation Street" />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Configure global system settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Timesheet Lock Period</Label>
                    <p className="text-sm text-neutral-500">
                      Set the number of days after which timesheets are locked for editing
                    </p>
                  </div>
                  <Input className="w-20" defaultValue="15" type="number" min="1" max="30" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Default Working Hours</Label>
                    <p className="text-sm text-neutral-500">
                      Set the standard working hours per day for timesheet validation
                    </p>
                  </div>
                  <Input className="w-20" defaultValue="8" type="number" min="1" max="12" />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="weekend-timesheet" />
                  <Label htmlFor="weekend-timesheet">Allow weekend timesheet entries</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="auto-remind" defaultChecked />
                  <Label htmlFor="auto-remind">Send automatic timesheet reminders</Label>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage email and system notification settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Email Notifications</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-projects">Project assignments</Label>
                    <Switch id="email-projects" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-timesheet">Timesheet reminders</Label>
                    <Switch id="email-timesheet" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-skills">Skill updates</Label>
                    <Switch id="email-skills" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-pipeline">Pipeline updates</Label>
                    <Switch id="email-pipeline" defaultChecked />
                  </div>
                </div>
                
                <h3 className="text-lg font-medium mt-6">System Notifications</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="system-projects">Project assignments</Label>
                    <Switch id="system-projects" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="system-timesheet">Timesheet reminders</Label>
                    <Switch id="system-timesheet" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="system-skills">Skill updates</Label>
                    <Switch id="system-skills" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="system-pipeline">Pipeline updates</Label>
                    <Switch id="system-pipeline" defaultChecked />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button>Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Notification Schedule</CardTitle>
              <CardDescription>
                Set when automated notifications should be sent.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="timesheet-day">Timesheet Reminder Day</Label>
                    <select className="w-full p-2 border rounded-md" id="timesheet-day">
                      <option>Monday</option>
                      <option>Tuesday</option>
                      <option>Wednesday</option>
                      <option selected>Thursday</option>
                      <option>Friday</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="timesheet-time">Timesheet Reminder Time</Label>
                    <Input id="timesheet-time" type="time" defaultValue="10:00" />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="send-digest" defaultChecked />
                  <Label htmlFor="send-digest">Send weekly activity digest</Label>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button>Save Schedule</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Password Policy</CardTitle>
              <CardDescription>
                Configure security settings for passwords.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Minimum Password Length</Label>
                    <p className="text-sm text-neutral-500">
                      Set the minimum number of characters required for passwords
                    </p>
                  </div>
                  <Input className="w-20" defaultValue="8" type="number" min="6" max="20" />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-base">Password Requirements</Label>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="pass-upper" defaultChecked />
                      <Label htmlFor="pass-upper">Require uppercase letters</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox id="pass-lower" defaultChecked />
                      <Label htmlFor="pass-lower">Require lowercase letters</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox id="pass-number" defaultChecked />
                      <Label htmlFor="pass-number">Require numbers</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox id="pass-special" defaultChecked />
                      <Label htmlFor="pass-special">Require special characters</Label>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Password Expiry</Label>
                    <p className="text-sm text-neutral-500">
                      Days after which passwords must be changed
                    </p>
                  </div>
                  <Input className="w-20" defaultValue="90" type="number" min="0" max="365" />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button>Save Policy</Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <CardDescription>
                Configure additional security settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch id="two-factor" />
                  <div>
                    <Label htmlFor="two-factor" className="text-base">Enable Two-Factor Authentication</Label>
                    <p className="text-sm text-neutral-500">
                      Require two-factor authentication for all administrative accounts
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="session-timeout" defaultChecked />
                  <div>
                    <Label htmlFor="session-timeout" className="text-base">Session Timeout</Label>
                    <p className="text-sm text-neutral-500">
                      Automatically log out inactive users after 30 minutes
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="login-attempt" defaultChecked />
                  <div>
                    <Label htmlFor="login-attempt" className="text-base">Limit Login Attempts</Label>
                    <p className="text-sm text-neutral-500">
                      Lock accounts after 5 failed login attempts
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button>Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Update your personal details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full Name</Label>
                  <Input id="full-name" defaultValue={user?.name} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" defaultValue={user?.username} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={user?.email} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" disabled value={user?.role.replace('_', ' ')} className="capitalize" />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button>Update Profile</Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your login password.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button>Change Password</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>
                View information about the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-sm font-medium">Product Name:</div>
                  <div>Coditas Workforce Management</div>
                  
                  <div className="text-sm font-medium">Version:</div>
                  <div>1.0.0</div>
                  
                  <div className="text-sm font-medium">Build Date:</div>
                  <div>{new Date().toLocaleDateString()}</div>
                  
                  <div className="text-sm font-medium">Last Updated:</div>
                  <div>{new Date().toLocaleDateString()}</div>
                  
                  <div className="text-sm font-medium">License:</div>
                  <div>Enterprise</div>
                  
                  <div className="text-sm font-medium">License Expiry:</div>
                  <div>December 31, 2023</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Import/Export Data</CardTitle>
              <CardDescription>
                Import or export system data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Export Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-neutral-500 mb-4">
                      Export system data to CSV or Excel format for backup or analysis
                    </p>
                    <Button variant="outline" className="w-full">Export Data</Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Import Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-neutral-500 mb-4">
                      Import data from CSV or Excel files to update system records
                    </p>
                    <Button variant="outline" className="w-full">Import Data</Button>
                  </CardContent>
                </Card>
              </div>
              
              <div className="flex justify-between mt-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Data Maintenance</h3>
                  <p className="text-sm text-neutral-500">
                    Tools for maintaining system data integrity
                  </p>
                </div>
                <div className="space-x-2">
                  <Button variant="outline">Validate Data</Button>
                  <Button variant="outline">Backup Data</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
