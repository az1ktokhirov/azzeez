import React, { useEffect, useState } from "react";
import { superAdminAPI } from "../../../api";
import { Card, Loading } from "../../../components/UI";

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const res = await superAdminAPI.getAnalytics();
      setAnalytics(res.data);
    } catch (error) {
      console.error("Load analytics error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Platform Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <div className="text-center">
            <p className="text-gray-600">Total Stores</p>
            <p className="text-4xl font-bold text-purple-600 mt-2">
              {analytics?.totalStores || 0}
            </p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-gray-600">Active Stores</p>
            <p className="text-4xl font-bold text-success mt-2">
              {analytics?.activeStores || 0}
            </p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-gray-600">Trial Stores</p>
            <p className="text-4xl font-bold text-blue-600 mt-2">
              {analytics?.trialStores || 0}
            </p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-gray-600">Suspended</p>
            <p className="text-4xl font-bold text-warning mt-2">
              {analytics?.suspendedStores || 0}
            </p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-gray-600">Recent Signups (30d)</p>
            <p className="text-4xl font-bold text-primary-600 mt-2">
              {analytics?.recentSignups || 0}
            </p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-gray-600">Expiring Trials (3d)</p>
            <p className="text-4xl font-bold text-danger mt-2">
              {analytics?.expiringTrials || 0}
            </p>
          </div>
        </Card>
      </div>

      <Card title="Quick Actions">
        <div className="grid grid-cols-2 gap-4">
          <a href="/superadmin/stores" className="btn btn-primary">
            View All Stores
          </a>
          <a href="/superadmin/announce" className="btn btn-secondary">
            Send Announcement
          </a>
        </div>
      </Card>
    </div>
  );
}
