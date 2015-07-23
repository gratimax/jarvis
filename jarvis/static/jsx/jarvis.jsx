var Router = ReactRouter;
var { Route, RouteHandler } = Router;

$c = (component) => $(React.findDOMNode(component));

var schedulerPlan = [];

class App extends React.Component {
  render() {
    return (
      <div>
        <nav className="navbar navbar-inverse navbar-static-top">
          <div className="container">
            <div className="row">
              <div className="col-sm-12">
                <div className="navbar-header">
                  <a className="navbar-brand" href="#">Jarvis</a>
                </div>
              </div>
            </div>
          </div>
        </nav>
        <RouteHandler/>
        <div className="footer">
          <div className="container">
            <div className="row">
              <div className="col-sm-6">
                Made with <i className="glyphicon glyphicon-heart"></i> by Lee Mracek, Max Ovsiankin and Ali Asif
              </div>
              <div className="col-sm-6">
                <div className="text-right">
                  Source on <a href="https://github.com/gratimax/jarvis">GitHub</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

class Home extends React.Component {


  render() {
    var tagline = "Jarvis crunches the best De Anza (fall) schedule so that you don't have to.";
    return (
      <div className="jumbotron">
        <div className="container">
          <h1>Jarvis</h1>
          <p>{tagline}</p>
          <p>
            <a className="btn btn-primary btn-lg" href="#/search-courses">
              Get started »
            </a>
          </p>
        </div>
      </div>
    );
  }
}

class SearchCourses extends React.Component {

  constructor() {
    this.state = {searchQuery: '', plan: []};
  }

  handleSearch(evt) {
    evt.preventDefault();
    this.setState({searchQuery: $c(this.refs.search).val(), plan: this.state.plan});
  }

  removeFromPlan(courseTitle) {
    var newPlan = this.state.plan.filter(courseResult => courseResult.course.title !== courseTitle);
    this.setState({
      searchQuery: this.state.searchQuery,
      plan: newPlan
    });
    schedulerPlan = newPlan.map(courseResult => courseResult.options);
  }

  addToPlan(courseResult) {
    var newPlan = this.state.plan.concat([courseResult]);
    this.setState({
      searchQuery: this.state.searchQuery,
      plan: newPlan
    });
    schedulerPlan = newPlan.map(courseResult => courseResult.options);
  }

  render() {
    return (
      <div className="container">
        <div className="row">
          <div className="col-sm-12">
            <h1>Search Courses</h1>
            <p>Get started by searching courses.</p>
          </div>
        </div>
        <div className="row">
          <div className="col-sm-3">
            <form role="form" onSubmit={this.handleSearch.bind(this)} ref="search-form">
              <div className="input-group">
                <input className="form-control" type="text" placeholder="Search..." ref="search"/>
                <span className="input-group-btn">
                    <button type="submit" className="btn btn-primary"><i className="glyphicon glyphicon-search"></i></button>
                </span>
              </div>
            </form>
            <CoursePlan plan={this.state.plan} removeFromPlan={this.removeFromPlan.bind(this)}/>
          </div>
          <div className="col-sm-9">
            <SearchResults searchQuery={this.state.searchQuery} addToPlan={this.addToPlan.bind(this)}/>
          </div>
        </div>
      </div>
    );
  }
}

class CoursePlan extends React.Component {

  render() {
    var content;
    if (this.props.plan.length > 0) {
      content = (
          <div>
            <ul className="list-group">
              {this.props.plan.map(courseResult =>
                <li className="list-group-item">
                  {courseResult.course.title} ({courseResult.options.length} options)
                  <button className="btn btn-xs pull-right"
                          onClick={() => this.props.removeFromPlan(courseResult.course.title)}>
                    <i className="glyphicon glyphicon-remove"></i>
                  </button>
                </li>
              )}
            </ul>
            <a href="#/scheduler" className="btn btn-primary">Create Schedules!</a>
          </div>
      );
    } else {
      content = <p>Search for classes, then click the "add to plan" button to add them here!</p>;
    }
    return (
      <div>
        <h3>Plan</h3>
        {content}
      </div>

    )
  }

}

class SearchResults extends React.Component {

  constructor(props) {
    super(props);
    this.state = {loading: true};
  }

  componentWillReceiveProps(newProps) {
    this.setState({loading: true});
    $.ajax({
      type: 'POST',
      url: '/search',
      data: JSON.stringify({query: newProps.searchQuery}),
      contentType: 'application/json',
      dataType: 'json',
      success: function (data) {
        var pairs = [];
        for (var key in data) {
          if (data.hasOwnProperty(key)) {
            var options = data[key];
            pairs.push({course: {title: key, description: options[0].title}, options: options});
          }
        }
        this.setState({loading: false, results: pairs});
      }.bind(this)
    });
  }

  shouldComponentUpdate(newProps, newState) {
    return newProps.searchQuery !== this.props.searchQuery || this.state.results !== newState.results;
  }

  flatten(lists) {
    return [].concat.apply([], lists);
  }

  render() {
    var output;
    if (this.props.searchQuery == '') {
      output = (
        <ul className="list-group">
          <li className="list-group-item">
            <span className="text-muted">results will appear here...</span>
          </li>
        </ul>
      );
    } else {
      if (this.state.loading) {
        output = <Spinner/>;
      } else {
        //var numResults = this.state.results
        //  .map((result) => result.options.length)
        //  .reduce((a, b) => a + b);
        var numResults = this.state.results.length;
        output = <ul className="list-item-group">
          <li className="list-group-item text-right">{numResults} {numResults == 1 ? "result" : "results"}</li>
          {this.state.results.map(result =>
            <CourseSearchResult result={result} addToPlan={this.props.addToPlan}/>
          )}
        </ul>;
      }
    }
    return output;
  }

}

class CourseSearchResult extends React.Component {

  constructor(props) {
    super(props);
    this.state = {open: false};
  }

  toggleOpen() {
    this.setState({open: !this.state.open});
  }

  render() {
    var options;
    if (this.state.open) {
      options = (
          <ul className="list-item-group" onClick={this.toggleOpen.bind(this)}>
            {this.props.result.options.map(option =>
                <CourseSearchResultOption option={option}/>
            )}
          </ul>
      );
    } else {
      options = null;
    }
    return (
      <li className="list-group-item search-result">
        <h4 className="list-group-item-heading">{this.props.result.course.title}</h4>
        <div className="btn-group pull-right">
          <button type="button" className="btn btn-default" onClick={() => this.props.addToPlan(this.props.result)}>Add to plan</button>
          <button type="button" className="btn btn-default" onClick={() => this.toggleOpen()}>
            {this.state.open ? "Hide Options" : "Show Options"}
            <i className={"glyphicon glyphicon-chevron-" + (this.state.open ? "up" : "down")}></i>
          </button>
        </div>
        <p>{this.props.result.course.description}</p>
        {options}
      </li>
    );
  }

}

class CourseSearchResultOption extends React.Component {

  formatTime(time) {
    return moment({H: time.hours, m: time.minutes}).format('h:mm a');
  }

  meetingTime(time) {
    if (time === "TBA") {
      return time;
    } else {
      return `${this.formatTime(time.start)} - ${this.formatTime(time.end)}`;
    }
  }

  meetingRating(instructor) {
    if (instructor.rating === "unknown") {
      return instructor.rating;
    } else {
      return instructor.rating.score;
    }
  }

  meetingInstructor(meeting) {
    return `${meeting.instructor.first_name} ${meeting.instructor.last_name}`;
  }

  uniq(arr) {
    return arr.filter((x, i) => arr.indexOf(x) === i);
  }

  totalRating() {
    var ratings = this.props.option.meetings.map(meeting => this.meetingRating(meeting.instructor)).filter(rating => rating !== "unknown");
    if (ratings.length === 0) {
      return "unknown";
    } else {
      return (20 * ratings.reduce((a, b) => a + b) / ratings.length).toFixed(1);
    }
  }

  ratingHue(rating) {
    var a = 0.012;
    return a * rating * rating;
  }

  ratingStyle() {
    var total = this.totalRating();
    if (total !== "unknown") {
      return {
        color: `hsla(${this.ratingHue(total)}, 80%, 40%, 1)`
      };
    } else {
      return {};
    }
  }

  render() {
    return (
      <li className="list-group-item">
        <p className="list-group-item-text">
          #{this.props.option.crn} <span className="text-muted pull-right">({this.props.option.course})</span>
          <div className="row">
            <div className="col-xs-4">
              {this.uniq(this.props.option.meetings.map(this.meetingInstructor)).join(', ')}
            </div>
            <div className="col-xs-4" style={this.ratingStyle()}>
              <strong>{this.totalRating()}</strong>
            </div>
          </div>
        </p>
      </li>
    )
  }

}

class Spinner extends React.Component {

  render() {
    return (
      <div className="spinner">
        <div className="rect1"></div>
        <div className="rect2"></div>
        <div className="rect3"></div>
        <div className="rect4"></div>
        <div className="rect5"></div>
      </div>
    )
  }

}

class Scheduler extends React.Component {

  constructor() {
    if (schedulerPlan.length > 0) {
      this.state = {loading: true, results: []};
      $.ajax({
        type: 'POST',
        url: '/schedule',
        data: JSON.stringify(schedulerPlan),
        contentType: 'application/json',
        dataType: 'json',
        success: function (data) {
          console.log(data);
          this.setState({loading: false, results: data});
        }.bind(this)
      });
    } else {
      this.state = {loading: false, results: []};
    }
  }

  //componentWillReceiveProps(newProps) {
  //  this.setState({loading: true});
  //
  //}

  render() {
    var output;
    if (this.state.loading) {
      output = <Spinner/>;
    } else {
      if (this.state.results.length > 0) {
        var numResults = this.state.results.length;
        output = <ul className="list-item-group">
          <li className="list-group-item text-right">{numResults} {numResults == 1 ? "result" : "results"}</li>
          {this.state.results.map(result =>
            <li className="list-group-item">
              {result.rating}
              <ul className="list-item-group">
                {result.schedule.map(course =>
                  <CourseSearchResultOption option={course}/>
                )}
              </ul>
            </li>
          )}
        </ul>;
      } else {
        output = <ul className="list-item-group">
          <li className="list-group-item text-right">0 results</li>
          <li className="list-group-item text-right">No schedules found :( :( :( try another plan?</li>
        </ul>;
      }
    }
    return (
        <div className="container">
          <div className="row">
            <div className="col-sm-12">
              <h1>Scheduler Output</h1>
              {output}
            </div>
          </div>
        </div>
    );
  }
}

class CourseScheduleVisualization extends React.Component {



}

var routes = (
  <Route handler={App}>
    <Route path="/" handler={Home}/>
    <Route path="search-courses" handler={SearchCourses}/>
    <Route path="scheduler" handler={Scheduler}/>
  </Route>
);

Router.run(routes, Router.HashLocation, Root => {
  React.render(<Root/>, $("#app").get(0));
});
