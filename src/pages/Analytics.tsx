import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Download, 
  Calendar,
  Users,
  Building,
  FileText,
  Clock,
  Target,
  Activity,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { useBillContext } from '../context/BillContext';
import { format, subDays, subMonths, isAfter, isBefore } from 'date-fns';

interface MetricCard {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

const Analytics: React.FC = () => {
  const { bills, refreshBills } = useBillContext();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  const [selectedChamber, setSelectedChamber] = useState<'all' | 'house' | 'senate'>('all');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter bills based on time range and chamber
  const filteredBills = useMemo(() => {
    let filtered = bills;

    // Filter by chamber
    if (selectedChamber !== 'all') {
      filtered = filtered.filter(bill => bill.chamber === selectedChamber);
    }

    // Filter by time range
    if (timeRange !== 'all') {
      const now = new Date();
      let cutoffDate: Date;

      switch (timeRange) {
        case '7d':
          cutoffDate = subDays(now, 7);
          break;
        case '30d':
          cutoffDate = subDays(now, 30);
          break;
        case '90d':
          cutoffDate = subDays(now, 90);
          break;
        case '1y':
          cutoffDate = subMonths(now, 12);
          break;
        default:
          cutoffDate = new Date(0);
      }

      filtered = filtered.filter(bill => 
        isAfter(new Date(bill.introducedDate), cutoffDate)
      );
    }

    return filtered;
  }, [bills, timeRange, selectedChamber]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalBills = filteredBills.length;
    const enactedBills = filteredBills.filter(bill => bill.status === 'enacted').length;
    const activeBills = filteredBills.filter(bill => 
      !['enacted', 'vetoed'].includes(bill.status)
    ).length;
    const totalSponsors = new Set(
      filteredBills.flatMap(bill => bill.sponsors?.map(s => s.name) || [])
    ).size;
    const totalCommittees = new Set(
      filteredBills.flatMap(bill => bill.committees?.map(c => c.committee.name) || [])
    ).size;
    const avgTimelineLength = filteredBills.reduce((acc, bill) => 
      acc + (bill.timeline?.length || 0), 0
    ) / Math.max(totalBills, 1);

    // Calculate recent activity (last 7 days)
    const recentCutoff = subDays(new Date(), 7);
    const recentActivity = filteredBills.filter(bill =>
      isAfter(new Date(bill.lastActionDate), recentCutoff)
    ).length;

    const metricsData: MetricCard[] = [
      {
        title: 'Total Bills',
        value: totalBills.toLocaleString(),
        icon: <FileText size={24} />,
        color: 'bg-blue-500',
        change: 12,
        changeType: 'increase'
      },
      {
        title: 'Enacted Laws',
        value: enactedBills.toLocaleString(),
        icon: <Target size={24} />,
        color: 'bg-green-500',
        change: 8,
        changeType: 'increase'
      },
      {
        title: 'Active Bills',
        value: activeBills.toLocaleString(),
        icon: <Activity size={24} />,
        color: 'bg-orange-500',
        change: -3,
        changeType: 'decrease'
      },
      {
        title: 'Unique Sponsors',
        value: totalSponsors.toLocaleString(),
        icon: <Users size={24} />,
        color: 'bg-purple-500',
        change: 5,
        changeType: 'increase'
      },
      {
        title: 'Active Committees',
        value: totalCommittees.toLocaleString(),
        icon: <Building size={24} />,
        color: 'bg-indigo-500',
        change: 0,
        changeType: 'neutral'
      },
      {
        title: 'Recent Activity',
        value: recentActivity.toLocaleString(),
        icon: <Clock size={24} />,
        color: 'bg-red-500',
        change: 15,
        changeType: 'increase'
      }
    ];

    return metricsData;
  }, [filteredBills]);

  // Status distribution data
  const statusData = useMemo(() => {
    const statusCounts = filteredBills.reduce((acc, bill) => {
      acc[bill.status] = (acc[bill.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const colors = {
      'introduced': '#6B7280',
      'referred_to_committee': '#3B82F6',
      'reported_by_committee': '#8B5CF6',
      'passed_house': '#10B981',
      'passed_senate': '#059669',
      'to_president': '#F59E0B',
      'signed': '#84CC16',
      'enacted': '#22C55E',
      'vetoed': '#EF4444'
    };

    return Object.entries(statusCounts).map(([status, count]) => ({
      label: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: count,
      color: colors[status as keyof typeof colors] || '#6B7280'
    }));
  }, [filteredBills]);

  // Chamber distribution
  const chamberData = useMemo(() => {
    const chamberCounts = filteredBills.reduce((acc, bill) => {
      acc[bill.chamber] = (acc[bill.chamber] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { label: 'House', value: chamberCounts.house || 0, color: '#3B82F6' },
      { label: 'Senate', value: chamberCounts.senate || 0, color: '#EF4444' }
    ];
  }, [filteredBills]);

  // Topic distribution (top 10)
  const topicData = useMemo(() => {
    const topicCounts = filteredBills.reduce((acc, bill) => {
      bill.topics?.forEach(topic => {
        acc[topic] = (acc[topic] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic, count]) => ({
        label: topic,
        value: count,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
      }));
  }, [filteredBills]);

  // Timeline activity (last 30 days)
  const timelineData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      return {
        date: format(date, 'MMM dd'),
        introduced: 0,
        actions: 0
      };
    });

    filteredBills.forEach(bill => {
      const introducedDate = new Date(bill.introducedDate);
      const dayIndex = last30Days.findIndex(day => 
        format(introducedDate, 'MMM dd') === day.date
      );
      if (dayIndex !== -1) {
        last30Days[dayIndex].introduced++;
      }

      bill.timeline?.forEach(event => {
        const eventDate = new Date(event.date);
        const dayIndex = last30Days.findIndex(day => 
          format(eventDate, 'MMM dd') === day.date
        );
        if (dayIndex !== -1) {
          last30Days[dayIndex].actions++;
        }
      });
    });

    return last30Days;
  }, [filteredBills]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshBills();
    } finally {
      setIsRefreshing(false);
    }
  };

  const exportData = () => {
    const data = {
      metrics,
      statusDistribution: statusData,
      chamberDistribution: chamberData,
      topTopics: topicData,
      timelineActivity: timelineData,
      exportDate: new Date().toISOString(),
      filters: { timeRange, selectedChamber }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `legislative-analytics-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const getChangeIcon = (changeType: 'increase' | 'decrease' | 'neutral') => {
    switch (changeType) {
      case 'increase':
        return <ArrowUp size={16} className="text-green-600" />;
      case 'decrease':
        return <ArrowDown size={16} className="text-red-600" />;
      default:
        return <Minus size={16} className="text-gray-600" />;
    }
  };

  const getChangeColor = (changeType: 'increase' | 'decrease' | 'neutral') => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600';
      case 'decrease':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <BarChart3 size={32} className="mr-3 text-primary-600" />
                Legislative Analytics
              </h1>
              <p className="text-gray-600 mt-1">
                Comprehensive insights into congressional activity and bill progression
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                <RefreshCw size={16} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={exportData}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Download size={16} className="mr-2" />
                Export Data
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar size={20} className="text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Time Range:</label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                  <option value="all">All time</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <Building size={20} className="text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Chamber:</label>
                <select
                  value={selectedChamber}
                  onChange={(e) => setSelectedChamber(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">All Chambers</option>
                  <option value="house">House</option>
                  <option value="senate">Senate</option>
                </select>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              Analyzing {filteredBills.length.toLocaleString()} bills
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${metric.color} text-white p-3 rounded-lg`}>
                  {metric.icon}
                </div>
                {metric.change !== undefined && (
                  <div className={`flex items-center space-x-1 ${getChangeColor(metric.changeType!)}`}>
                    {getChangeIcon(metric.changeType!)}
                    <span className="text-sm font-medium">{Math.abs(metric.change)}%</span>
                  </div>
                )}
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {metric.value}
              </div>
              <div className="text-sm text-gray-600">
                {metric.title}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Bill Status Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <PieChart size={20} className="mr-2 text-primary-600" />
                Bill Status Distribution
              </h3>
              <button
                onClick={() => toggleSection('status')}
                className="text-gray-500 hover:text-gray-700"
              >
                {expandedSection === 'status' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
            
            <div className="space-y-3">
              {statusData.map((item, index) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{item.value}</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{ 
                          backgroundColor: item.color,
                          width: `${(item.value / Math.max(...statusData.map(d => d.value))) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Chamber Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Building size={20} className="mr-2 text-primary-600" />
                Chamber Distribution
              </h3>
            </div>
            
            <div className="space-y-4">
              {chamberData.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-gray-900">{item.value}</span>
                    <span className="text-sm text-gray-600">
                      ({((item.value / filteredBills.length) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Total Bills: <span className="font-medium text-gray-900">{filteredBills.length}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Activity Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <TrendingUp size={20} className="mr-2 text-primary-600" />
              Legislative Activity Timeline (Last 30 Days)
            </h3>
          </div>
          
          <div className="h-64 flex items-end space-x-1">
            {timelineData.map((day, index) => (
              <div key={day.date} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col space-y-1">
                  <div 
                    className="bg-primary-500 rounded-t"
                    style={{ 
                      height: `${(day.introduced / Math.max(...timelineData.map(d => d.introduced + d.actions))) * 200}px` 
                    }}
                    title={`${day.introduced} bills introduced`}
                  />
                  <div 
                    className="bg-blue-300 rounded-b"
                    style={{ 
                      height: `${(day.actions / Math.max(...timelineData.map(d => d.introduced + d.actions))) * 200}px` 
                    }}
                    title={`${day.actions} actions taken`}
                  />
                </div>
                {index % 5 === 0 && (
                  <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                    {day.date}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex items-center justify-center space-x-6 mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary-500 rounded" />
              <span className="text-sm text-gray-600">Bills Introduced</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-300 rounded" />
              <span className="text-sm text-gray-600">Legislative Actions</span>
            </div>
          </div>
        </motion.div>

        {/* Top Topics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BarChart3 size={20} className="mr-2 text-primary-600" />
              Top Legislative Topics
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topicData.map((topic, index) => (
              <div key={topic.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="text-sm font-medium text-gray-600">#{index + 1}</div>
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: topic.color }}
                  />
                  <span className="text-sm font-medium text-gray-900">{topic.label}</span>
                </div>
                <span className="text-sm font-bold text-gray-700">{topic.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Analytics;