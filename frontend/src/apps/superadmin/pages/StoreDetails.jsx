import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { superAdminAPI } from "../../../api";
import { Card, Loading, Badge } from "../../../components/UI";
import {
  getStatusBadge,
  getStatusText,
  formatDate,
} from "../../../utils/helpers";

export default function SuperAdminStoreDetails() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStore();
  }, [id]);

  const loadStore = async () => {
    try {
      const res = await superAdminAPI.getStoreDetails(id);
      setStore(res.data.tenant);
      setStats(res.data.stats);
    } catch (error) {
      console.error("Load store error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;
  if (!store) return <div>Store not found</div>;

  return (
    <div className="space-y-6">
      <Card>
        <h1 className="text-2xl font-bold mb-4">{store.storeName}</h1>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Owner Email</p>
            <p className="font-medium">{store.ownerEmail}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <Badge variant={getStatusBadge(store.status).replace("badge-", "")}>
              {getStatusText(store.status)}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-gray-600">Created</p>
            <p className="font-medium">{formatDate(store.createdAt)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Trial Ends</p>
            <p className="font-medium">
              {store.trialEndsAt ? formatDate(store.trialEndsAt) : "N/A"}
            </p>
          </div>
        </div>
      </Card>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="text-center">
              <p className="text-gray-600">Users</p>
              <p className="text-3xl font-bold text-primary-600 mt-2">
                {stats.users}
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-600">Products</p>
              <p className="text-3xl font-bold text-success mt-2">
                {stats.products}
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-600">Total Sales</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {stats.sales}
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-600">Revenue</p>
              <p className="text-3xl font-bold text-success mt-2">
                {parseFloat(stats.totalRevenue).toFixed(0)} UZS
              </p>
            </div>
          </Card>
        </div>
      )}

      {store.notes && (
        <Card title="Internal Notes">
          <p className="text-gray-700">{store.notes}</p>
        </Card>
      )}
    </div>
  );
}
