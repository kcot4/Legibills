    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 dark:text-white">Track Legislators</h1>

      <div className="mb-6 relative">
        <input
          type="text"
          placeholder="Search by name..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>

      {loading && <LoadingSpinner variant="bills" size="lg" message="Searching..." />}
      {error && <div className="text-red-600 mb-4 dark:text-red-400">Error: {error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {legislators.map((legislator) => (
          <div key={legislator.id} className="bg-white p-4 rounded-lg shadow flex items-center justify-between dark:bg-gray-800 dark:shadow-lg">
            <div>
              <h2 className="font-semibold text-lg dark:text-white">{legislator.full_name}</h2>
              <p className="text-gray-600 text-sm dark:text-gray-300">{legislator.party} - {legislator.state}</p>
            </div>
            <button
              onClick={() => handleTrackToggle(legislator.id)}
              className={`px-4 py-2 rounded-md text-white font-medium ${trackedLegislatorIds.includes(legislator.id) ? 'bg-red-500 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-600' : 'bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600'}`}
              disabled={loading}
            >
              {trackedLegislatorIds.includes(legislator.id) ? (
                <span className="flex items-center"><UserMinus size={16} className="mr-2" /> Untrack</span>
              ) : (
                <span className="flex items-center"><UserPlus size={16} className="mr-2" /> Track</span>
              )}
            </button>
          </div>
        ))}
      </div>

      {legislators.length === 0 && searchTerm && !loading && !error && (
        <p className="text-center text-gray-500 mt-8 dark:text-gray-400">No legislators found matching your search.</p>
      )}

      {trackedLegislatorIds.length > 0 && !searchTerm && !loading && !error && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">Your Tracked Legislators</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {legislators.filter(l => trackedLegislatorIds.includes(l.id)).map(legislator => (
              <div key={legislator.id} className="bg-white p-4 rounded-lg shadow flex items-center justify-between border-2 border-primary-500 dark:bg-gray-800 dark:shadow-lg dark:border-primary-700">
                <div>
                  <h2 className="font-semibold text-lg dark:text-white">{legislator.full_name}</h2>
                  <p className="text-gray-600 text-sm dark:text-gray-300">{legislator.party} - {legislator.state}</p>
                </div>
                <button
                  onClick={() => handleTrackToggle(legislator.id)}
                  className="px-4 py-2 rounded-md text-white font-medium bg-red-500 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-600"
                  disabled={loading}
                >
                  <span className="flex items-center"><UserMinus size={16} className="mr-2" /> Untrack</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
